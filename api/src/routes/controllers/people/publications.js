import { pool } from '../../../db.js'
import { notifyExternalApi } from '../../../utils/externalNotifier.js'



export async function getAuthorNames(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            `SELECT id, name
             FROM author_names
             WHERE person_id = ?
             ORDER BY id;`,
            [personId]
        )
        res.json(rows)
    } catch (err) {
        console.error('Fetch author names error:', err)
        res.status(500).json({ message: 'Something went wrong - Author Names' })
    }
}

export async function updateAuthorNames(req, res) {
    const { personId } = req.params
    const rows = req.body.author_names

    if (!Array.isArray(rows)) return res.status(400).json({ message: 'Invalid payload.' })

    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        // 1. delete this person's rows that are not in the payload
        const keepIds = rows.filter(r => r.id).map(r => r.id)
        if (keepIds.length) {
            await conn.query(
                'DELETE FROM author_names WHERE person_id = ? AND id NOT IN (?)',
                [personId, keepIds]
            )
        } else {
            await conn.query('DELETE FROM author_names WHERE person_id = ?', [personId])
        }

        // 2. update existing rows, insert new ones
        for (const r of rows) {
            if (r.id) {
                await conn.query(
                    `UPDATE author_names
                        SET name = ?
                        WHERE id = ? AND person_id = ?`,
                    [r.name, r.id, personId]
                )
            } else {
                await conn.query(
                    `INSERT INTO author_names (person_id, name)
                        VALUES (?, ?)`,
                    [personId, r.name]
                )
            }
        }
        await conn.commit()
    } catch (err) {
        await conn.rollback()
        console.error(err)
        return res.status(500).json({ message: 'Something went wrong.' })
    } finally {
        conn.release()
    }

    // 3. return the saved rows, in the same shape as the GET
    const [saved] = await pool.query(
       `SELECT id, name
             FROM author_names
             WHERE person_id = ?
             ORDER BY id;`,
        [personId]
    )
    notifyExternalApi('update', 'people', personId)
    res.json(saved)

}

const PUB_LINK_FIELDS = [
    'author_type_id', 'position', 'public', 'selected',
    'selected_rank', 'in_institutional_repository',
];
const PUB_FIELDS = [
    'title', 'authors_raw', 'number_authors', 'journal_id', 'volume', 'page_start',
    'page_end', 'doi', 'wos', 'pubmed_id', 'publication_date', 'year',
];

export const PUBLICATION_ROWS_SQL = `
    SELECT pp.id, pp.publication_id, pp.author_type_id, pp.position,
            COALESCE(pp.public, 0) AS public,
            COALESCE(pp.selected, 0) AS selected,
            pp.selected_rank,
            CAST(COALESCE(pp.in_institutional_repository, 0) AS UNSIGNED) AS in_institutional_repository,
            p.title, p.authors_raw, p.number_authors, p.journal_id,
            j.name AS journal, j.short_name AS journal_short_name,
            p.volume, p.page_start, p.page_end, p.doi, p.wos, p.pubmed_id,
            p.publication_date, p.year,
            (SELECT pd.publication_type FROM publication_descriptions pd
            WHERE pd.publication_id = p.id ORDER BY pd.id LIMIT 1) AS publication_type_id,
            (SELECT c.citations FROM citations c
            WHERE c.publication_id = p.id
            ORDER BY c.year DESC LIMIT 1) AS citations
        FROM people_publications pp
        JOIN publications p ON p.id = pp.publication_id
        LEFT JOIN journals j ON j.id = p.journal_id
    WHERE pp.person_id = ?`;

function buildSet(fields, obj = {}) {
    const keys = fields.filter((f) => f in obj);
    return { sql: keys.map((k) => `${k} = ?`).join(', '), values: keys.map((k) => obj[k]) };
}

export async function getPersonPublications(req, res) {
    const [rows] = await pool.query(
        `${PUBLICATION_ROWS_SQL} ORDER BY p.year DESC, p.publication_date DESC, p.id DESC`,
        [req.params.personId]
    );
    res.json(rows);
}

// body: { link?: {...}, details?: {...} }; only the keys present are updated
export async function updatePersonPublication(req, res) {
    const { personId, publicationId } = req.params;
    const { link, details } = req.body;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const l = buildSet(PUB_LINK_FIELDS, link);
        if (l.sql) {
            await conn.query(
                `UPDATE people_publications SET ${l.sql} WHERE person_id = ? AND publication_id = ?`,
                [...l.values, personId, publicationId]
            );
        }

        const d = buildSet(PUB_FIELDS, details);
        if (d.sql) {
            await conn.query(
                `UPDATE publications SET ${d.sql}, updated = NOW() WHERE id = ?`,
                [...d.values, publicationId]
            );
        }

        if (details && 'publication_type_id' in details) {
            await conn.query('DELETE FROM publication_descriptions WHERE publication_id = ?', [publicationId]);
            if (details.publication_type_id != null) {
                await conn.query(
                    'INSERT INTO publication_descriptions (publication_id, publication_type) VALUES (?, ?)',
                    [publicationId, details.publication_type_id]
                );
            }
        }

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
    notifyExternalApi('update', 'publications', publicationId)
    const [rows] = await pool.query(`${PUBLICATION_ROWS_SQL} AND pp.publication_id = ?`, [personId, publicationId]);
    res.json(rows[0]);
}

// removes only the person↔publication link; the shared publication stays
export async function dissociatePublication(req, res) {
    const { personId, publicationId } = req.params;
    await pool.query(
        'DELETE FROM people_publications WHERE person_id = ? AND publication_id = ?',
        [personId, publicationId]
    );
    notifyExternalApi('update', 'publications', publicationId)
    res.status(204).end();
}

export async function searchJournals(req, res) {
    const like = `%${(req.query.q ?? '').trim()}%`;
    const [rows] = await pool.query(
        `SELECT id, name, short_name, publisher, issn, eissn
        FROM journals
        WHERE name LIKE ? OR short_name LIKE ? OR issn LIKE ? OR eissn LIKE ?
        ORDER BY name LIMIT 20`,
        [like, like, like, like]
    );
    res.json(rows);
}
