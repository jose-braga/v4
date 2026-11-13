import { pool } from '../../../db.js'
import { notifyExternalApi } from '../../../utils/externalNotifier.js'
import { PUBLICATION_ROWS_SQL } from './publications.js';

// ---- search publications not yet linked to this person ----------------------
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "dep com" → words; dep "Braga, J" → word + phrase
function parseSearch(q = '') {
    const terms = [];
    const re = /"([^"]*)"|(\S+)/g;
    let m;
    while ((m = re.exec(q))) {
        if (m[1] !== undefined) {
            const phrase = m[1].trim();
            if (phrase) terms.push({ phrase });
        } else {
            const word = m[2].replace(/"/g, '');
            if (word) terms.push({ word });
        }
    }
    return terms;
}

export async function searchPersonPublications(req, res) {
    const { personId } = req.params;
    const terms = parseSearch(req.query.q ?? '');
    if (!terms.length) return res.json([]);

    const clauses = [];
    const params = [personId];
    for (const t of terms) {
        const rx = t.phrase !== undefined
        ? `(^|[^[:alnum:]])${escapeRegex(t.phrase)}([^[:alnum:]]|$)`
        : `(^|[^[:alnum:]])${escapeRegex(t.word)}`;
        clauses.push('(p.title REGEXP ? OR p.authors_raw REGEXP ?)');
        params.push(rx, rx);
    }

    const [rows] = await pool.query(
        `SELECT p.id AS publication_id, p.title, p.authors_raw, p.year, p.doi,
                j.name AS journal, j.short_name AS journal_short_name
        FROM publications p
        LEFT JOIN journals j ON j.id = p.journal_id
        WHERE NOT EXISTS (SELECT 1 FROM people_publications pp
                            WHERE pp.publication_id = p.id AND pp.person_id = ?)
            AND ${clauses.join(' AND ')}
        ORDER BY p.year DESC, p.id DESC
        LIMIT 50`,
        params
    );
    res.json(rows);
}

export async function addPersonPublication(req, res) {
    const { personId, publicationId } = req.params;
    const { author_type_id } = req.body;

    await pool.query(
        `INSERT INTO people_publications
                (person_id, publication_id, author_type_id, public, selected, in_institutional_repository)
        SELECT ?, ?, ?, 0, 0, 0 FROM DUAL
        WHERE NOT EXISTS (SELECT 1 FROM people_publications WHERE person_id = ? AND publication_id = ?)`,
        [personId, publicationId, author_type_id, personId, publicationId]
    );

    const [rows] = await pool.query(`${PUBLICATION_ROWS_SQL} AND pp.publication_id = ?`, [personId, publicationId]);
    notifyExternalApi('update', 'publications', publicationId)
    res.status(201).json(rows[0]);
}