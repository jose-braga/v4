import { pool } from '../../../db.js'
import { PUBLICATION_ROWS_SQL } from './publications.js';
import { notifyExternalApi } from '../../../utils/externalNotifier.js'

// ---------------------------------------------------------------- ORCID import
const ORCID_API = 'https://pub.orcid.org/v3.0';
const ORCID_RE = /\d{4}-\d{4}-\d{4}-\d{3}[\dX]/;
const ORCID_EXCLUDED_TYPES = new Set([
  'LECTURE_SPEECH', 'CONFERENCE_POSTER', 'CONFERENCE_PAPER',
  'DISSERTATION', 'BOOK_CHAPTER', 'BOOK',
]);

const baseUrl = process.env.PURE_BASE_URL?.trim().replace(/\/+$/, '');
const version = process.env.PURE_VERSION?.trim().replace(/^\/+/, '');
const PURE_API_URL = baseUrl && version ? `${baseUrl}/${version}` : undefined;
const PURE_API = PURE_API_URL ?? 'https://research.unl.pt/ws/api/524';
const PURE_ACCEPTED_TYPES = new Set(['article', 'review']);



async function orcidGet(path) {
    const r = await fetch(`${ORCID_API}/${path}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error(`ORCID API responded with ${r.status}`);
    return r.json();
}

const normType = (t) => (t ? String(t).toUpperCase().replace(/-/g, '_') : null);
const normDoi = (d) =>
    d ? d.trim().toLowerCase().replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '') : null;
const normText = (s) => (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
const cut = (s, n) => (s == null || String(s).trim() === '' ? null : String(s).trim().slice(0, n));
const DB_DOI = `REPLACE(REPLACE(LOWER(TRIM(doi)), 'https://doi.org/', ''), 'http://doi.org/', '')`;

function externalIds(obj) {
    const list = obj?.['external-ids']?.['external-id'] ?? [];
    const pick = (type) => {
        const m = list.filter((e) => e['external-id-type'] === type);
        const chosen = m.find((e) => e['external-id-relationship'] === 'self') ?? m[0];
        return chosen?.['external-id-value'] ?? null;
    };
    return { doi: normDoi(pick('doi')), pmid: pick('pmid'), wos: pick('wosuid'), issn: pick('issn') };
}
const mergeIds = (a, b) => ({
    doi: a.doi ?? b.doi, pmid: a.pmid ?? b.pmid, wos: a.wos ?? b.wos, issn: a.issn ?? b.issn,
});

// one entry per ORCID "group" (the same work asserted by several sources): take the first summary
function summaryOf(group) {
    const s = group['work-summary']?.[0];
    if (!s) return null;
    const ids = mergeIds(externalIds(s), externalIds(group));
    return {
        put_code: s['put-code'],
        title: s.title?.title?.value ?? null,
        journal_name: s['journal-title']?.value ?? null,
        year: s['publication-date']?.year?.value ? Number(s['publication-date'].year.value) : null,
        orcid_type: normType(s.type),
        ...ids,
    };
}

// minimal BibTeX field reader (handles one level of nested braces)
function bibtexField(bib, name) {
  const m = new RegExp(
    `\\b${name}\\s*=\\s*(?:\\{((?:[^{}]|\\{[^{}]*\\})*)\\}|"((?:[^"\\\\]|\\\\.)*)")`, 'i'
  ).exec(bib ?? '');
  return (m?.[1] ?? m?.[2] ?? null)?.replace(/\s+/g, ' ').trim() || null;
}

function candidateOf(summary, work) {
    const bib = work.citation?.['citation-type']?.toLowerCase() === 'bibtex'
        ? work.citation['citation-value'] : null;

    const contributors = (work.contributors?.contributor ?? [])
        .map((c) => c['credit-name']?.value).filter(Boolean);
    const bibAuthors = bibtexField(bib, 'author')?.split(/\s+and\s+/i).map((a) => a.trim()) ?? [];
    const authors = contributors.length ? contributors : bibAuthors;

    const pages = bibtexField(bib, 'pages');
    const [pageStart, pageEnd] = pages ? pages.split(/\s*[-–—]+\s*/) : [];

    const d = work['publication-date'];
    const year = d?.year?.value ? Number(d.year.value) : summary.year;
    const dateStr = [d?.year?.value, d?.month?.value, d?.day?.value].filter(Boolean).join('-') || null;

    const ids = mergeIds(externalIds(work), summary);

    return {
        source_id: String(summary.put_code),
        title: cut(work.title?.title?.value ?? summary.title, 400),
        authors_raw: authors.length ? authors.join('; ') : null,
        journal_name: cut(work['journal-title']?.value ?? summary.journal_name, 200),
        journal_id: null,
        issn: cut(ids.issn ?? bibtexField(bib, 'issn'), 10),
        year,
        publication_date: cut(dateStr, 45),
        volume: cut(bibtexField(bib, 'volume'), 30),
        page_start: cut(pageStart, 20),
        page_end: cut(pageEnd, 20),
        doi: cut(ids.doi, 100),
        pubmed_id: cut(ids.pmid, 10),
        wos: cut(ids.wos, 20),
        work_type: summary.orcid_type,
    };
}

async function mapLimit(items, limit, fn) {
    const out = new Array(items.length);
    let next = 0;
    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (next < items.length) {
            const k = next++;
            out[k] = await fn(items[k]);
        }
        })
    );
    return out;
}

// ORCID work-summaries that are not yet in the database
async function filterNew(summaries) {
    const dois = [...new Set(summaries.map((s) => s.doi).filter(Boolean))];
    const titles = [...new Set(summaries.map((s) => normText(s.title)).filter(Boolean))];

    const knownDois = new Set();
    if (dois.length) {
        const [rows] = await pool.query(`SELECT ${DB_DOI} AS doi FROM publications WHERE ${DB_DOI} IN (?)`, [dois]);
        rows.forEach((r) => knownDois.add(r.doi));
    }

    const titleAny = new Set();
    const titleNoDoi = new Set();
    if (titles.length) {
        const [rows] = await pool.query(
        `SELECT LOWER(TRIM(title)) AS t, doi FROM publications WHERE LOWER(TRIM(title)) IN (?)`, [titles]);
        rows.forEach((r) => {
        const t = normText(r.t);
        titleAny.add(t);
        if (!r.doi || !r.doi.trim()) titleNoDoi.add(t);
        });
    }

    return summaries.filter((s) => {
        const t = normText(s.title);
        if (s.doi) return !knownDois.has(s.doi) && !titleNoDoi.has(t);
        return !t || !titleAny.has(t);
    });
}

async function matchJournals(cands) {
    const names = [...new Set(cands.map((c) => normText(c.journal_name)).filter(Boolean))];
    const issns = [...new Set(cands.map((c) => c.issn?.toUpperCase()).filter(Boolean))];
    if (!names.length && !issns.length) return;

    const n = names.length ? names : [''];
    const i = issns.length ? issns : [''];
    const [rows] = await pool.query(
        `SELECT id, name, short_name, issn, eissn FROM journals
        WHERE LOWER(TRIM(name)) IN (?) OR LOWER(TRIM(short_name)) IN (?)
            OR UPPER(issn) IN (?) OR UPPER(eissn) IN (?)`,
        [n, n, i, i]
    );

    const byIssn = new Map(); const byName = new Map(); const byShort = new Map();
    for (const j of rows) {
        [j.issn, j.eissn].filter(Boolean).forEach((x) => byIssn.has(x.toUpperCase()) || byIssn.set(x.toUpperCase(), j));
        byName.has(normText(j.name)) || byName.set(normText(j.name), j);
        j.short_name && (byShort.has(normText(j.short_name)) || byShort.set(normText(j.short_name), j));
    }
    for (const c of cands) {
        const nm = normText(c.journal_name);
        const j = byIssn.get(c.issn?.toUpperCase()) ?? byName.get(nm) ?? byShort.get(nm);
        if (j) { c.journal_id = j.id; c.journal_name = j.name; }
    }
}

export async function getOrcidCandidates(req, res) {
    const { personId } = req.params;
    const [rows] = await pool.query('SELECT orcid FROM researchers_info WHERE person_id = ?', [personId]);
    const orcid = ORCID_RE.exec(rows[0]?.orcid ?? '')?.[0];
    if (!orcid) return res.json({ identifier: null, items: [], total: 0, already_in_database: 0 });

    try {
        const list = await orcidGet(`${orcid}/works`);
        const all = (list.group ?? []).map(summaryOf).filter((s) => s && s.put_code != null);
        const summaries = all.filter((s) => !ORCID_EXCLUDED_TYPES.has(s.orcid_type));
        const fresh = await filterNew(summaries);

        const items = await mapLimit(fresh, 6, async (s) => {
        try {
            const res = await orcidGet(`${orcid}/work/${s.put_code}`);
            const work = res.bulk?.[0]?.work ?? res;
            return candidateOf(s, work);
        } catch {
            return { ...candidateOf(s, {}), detail_failed: true };
        }
        });
        await matchJournals(items);

        res.json({
            identifier: orcid,
            items,
            total: all.length,
            excluded_by_type: all.length - summaries.length,
            already_in_database: summaries.length - fresh.length,
        });
    } catch (err) {
        res.status(502).json({ message: `Could not read ORCID: ${err.message}` });
    }
}
// ---------------------------------------------------------------- PURE import
async function pureGet(path) {
    const r = await fetch(`${PURE_API}/${path}`, {
        headers: { Accept: 'application/json', 'api-key': process.env.PURE_API_KEY ?? '' },
        signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) throw new Error(`PURE API responded with ${r.status}`);
    return r.json();
}

async function pureAllOutputs(pureId) {
    const size = 50;
    const items = [];
    for (let offset = 0; offset < 5000; offset += size) {
        const page = await pureGet(`persons/${pureId}/research-outputs?size=${size}&offset=${offset}`);
        items.push(...(page.items ?? []));
        if (!page.items?.length || offset + size >= (page.count ?? 0)) break;
    }
    return items;
}

const stripTags = (s) =>
    String(s ?? '')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ').trim();

// the one place that decides how an author is written
const formatAuthor = (n) => [n?.lastName, n?.firstName].filter(Boolean).join(', ');

function pureCandidate(item) {
    const extra = item.info?.additionalExternalIds ?? [];
    const extId = (src) => extra.find((e) => String(e.idSource).toLowerCase() === src)?.value ?? null;

    const doi = normDoi((item.electronicVersions ?? []).map((v) => v.doi).find(Boolean) ?? extId('doi'));

    const status = (item.publicationStatuses ?? []).find((s) => s.current) ?? item.publicationStatuses?.[0];
    const d = status?.publicationDate;
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = d?.year ? [d.year, d.month && pad(d.month), d.day && pad(d.day)].filter(Boolean).join('-') : null;

    const assoc = item.personAssociations ?? [];
    const asAuthors = assoc.filter((a) => !a.personRole?.uri || a.personRole.uri.endsWith('/author'));
    const authors = (asAuthors.length ? asAuthors : assoc).map((a) => formatAuthor(a.name)).filter(Boolean);

    const [p1, p2] = item.pages ? String(item.pages).split(/\s*[-–—]+\s*/) : [];
    const ja = item.journalAssociation;

    return {
        source_id: String(item.pureId ?? item.uuid),
        title: cut(stripTags(item.title?.value), 400),
        authors_raw: authors.length ? authors.join('; ') : null,
        journal_name: cut(stripTags(ja?.title?.value ?? ja?.journal?.name?.text?.[0]?.value), 200),
        journal_id: null,
        issn: cut(ja?.issn?.value, 10),
        year: d?.year ?? null,
        publication_date: cut(dateStr, 45),
        volume: cut(item.volume, 30),
        page_start: cut(p1, 20),
        page_end: cut(p2, 20),
        doi: cut(doi, 100),
        pubmed_id: cut(extId('pubmed'), 10),
        wos: cut(extId('wos'), 20),
        work_type: (item.type?.uri ?? '').split('/').pop() || null,
    };
}

export async function getPureCandidates(req, res) {
    const [rows] = await pool.query('SELECT pure_id FROM researchers_info WHERE person_id = ?', [req.params.personId]);
    const pureId = String(rows[0]?.pure_id ?? '').trim();
    if (!/^\d+$/.test(pureId)) {
        return res.json({ identifier: null, items: [], total: 0, excluded_by_type: 0, excluded_types: {}, already_in_database: 0 });
    }

    try {
        const outputs = await pureAllOutputs(pureId);

        const excludedTypes = {};
        const accepted = [];
        for (const o of outputs) {
        const uri = o.type?.uri ?? '';
        const name = uri.split('/').pop() || 'unknown';
        if (uri.includes('/contributiontojournal/') && PURE_ACCEPTED_TYPES.has(name)) accepted.push(o);
        else excludedTypes[name] = (excludedTypes[name] ?? 0) + 1;
        }

        const candidates = accepted.map(pureCandidate);
        const fresh = await filterNew(candidates);
        await matchJournals(fresh);

        res.json({
        identifier: pureId,
        items: fresh,
        total: outputs.length,
        excluded_by_type: outputs.length - accepted.length,
        excluded_types: excludedTypes,
        already_in_database: candidates.length - fresh.length,
        });
    } catch (err) {
        res.status(502).json({ message: `Could not read PURE: ${err.message}` });
    }
}

// one entry point for every import source
export function getImportCandidates(req, res) {
    const handler = { orcid: getOrcidCandidates, pure: getPureCandidates }[req.params.source];
    if (!handler) return res.status(404).json({ message: 'Unknown import source' });
    return handler(req, res);
}

const SOURCE_NAMES = { orcid: 'ORCID', pure: 'Institutional Repository' };

export async function importPublication(req, res) {
    const { personId } = req.params;
    const p = req.body.publication;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const doi = normDoi(p.doi);
        if (doi) {
            const [dup] = await conn.query(`SELECT id FROM publications WHERE ${DB_DOI} = ? LIMIT 1`, [doi]);
            if (dup.length) {
                await conn.rollback();
                return res.status(409).json({ message: 'A publication with this DOI already exists in the database' });
            }
        }

        // journal: use the matched/selected one, otherwise find by name, otherwise create it
        let journalId = p.journal_id ?? null;
        const journalName = cut(p.journal_name, 200);
        if (!journalId && journalName) {
        const [j] = await conn.query('SELECT id FROM journals WHERE LOWER(TRIM(name)) = ? LIMIT 1', [normText(journalName)]);
        if (j.length) {
            journalId = j[0].id;
        } else {
            const [ins] = await conn.query('INSERT INTO journals (name, issn) VALUES (?, ?)', [journalName, cut(p.issn, 10)]);
            journalId = ins.insertId;
        }
        }

        // publication source "ORCID"
        const sourceName = SOURCE_NAMES[req.params.source];
        let sourceId = null;
        if (sourceName) {
        const [src] = await conn.query('SELECT id FROM publication_sources WHERE name = ? LIMIT 1', [sourceName]);
        sourceId = src.length
            ? src[0].id
            : (await conn.query('INSERT INTO publication_sources (name) VALUES (?)', [sourceName]))[0].insertId;
        }
        const authors = cut(p.authors_raw, 10000);
        const [pub] = await conn.query(
        `INSERT INTO publications
            (authors_raw, number_authors, title, journal_id, volume, page_start, page_end,
            doi, wos, pubmed_id, publication_date, year, publication_source_id, updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
            authors, authors ? authors.split(';').filter((a) => a.trim()).length : null,
            cut(p.title, 400), journalId, cut(p.volume, 30), cut(p.page_start, 20), cut(p.page_end, 20),
            doi, cut(p.wos, 20), cut(p.pubmed_id, 10), cut(p.publication_date, 45),
            p.year ?? null, sourceId,
        ]
        );

        await conn.query(
        `INSERT INTO people_publications
            (person_id, publication_id, author_type_id, public, selected, in_institutional_repository)
        VALUES (?, ?, ?, 0, 0, 0)`,
        [personId, pub.insertId, req.body.author_type_id ?? null]
        );

        await conn.commit();

        const [rows] = await pool.query(`${PUBLICATION_ROWS_SQL} AND pp.publication_id = ?`, [personId, pub.insertId]);
        notifyExternalApi('update', 'publications', pub.insertId)
        res.status(201).json(rows[0]);
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

