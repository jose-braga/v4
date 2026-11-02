// routes/lookups.js
import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

// Whitelist: URL segment -> query. Table names never come from user input.
// Convention: every query returns at least `id` and `name`.
const lookups = {
    countries: 'SELECT id, name FROM countries ORDER BY name',
    'academic-institutions': `
        SELECT
            d.id AS id,
            CONCAT_WS(', ',
                NULLIF(d.name_en, ''),
                COALESCE(NULLIF(s.shortname_en, ''), s.name_en),
                COALESCE(NULLIF(u.shortname_en, ''), u.name_en)
            ) AS name
        FROM departments d
        JOIN schools s      ON s.id = d.school_id
        JOIN universities u ON u.id = s.university_id
        ORDER BY u.sort_order, s.sort_order, d.sort_order, name
    `,
    'academic-degrees':  `SELECT id, name_en AS name FROM degrees ORDER BY sort_order`,
    'supervisor-types':  `SELECT id, name_en AS name FROM supervisor_types ORDER BY sort_order`,
    'people':            `SELECT id, \`name\`
                            FROM people
                            WHERE \`name\` IS NOT NULL AND visible_public = 1
                            AND status = 1
                            ORDER BY \`name\``,
    'users':             `SELECT users.id as user_id, people.name
                            FROM users
                            JOIN people ON people.user_id = users.id
                            WHERE people.name IS NOT NULL AND people.visible_public = 1
                            AND people.status = 1
                            ORDER BY people.name`,

    'situations':        `SELECT id, name_en AS name, visible, sort_order FROM situations ORDER BY sort_order`,
    'situation-categories': `SELECT cs.id, cs.situation_id, c.name_en AS name,
                            (cs.visible AND c.visible) AS visible,
                            cs.sort_order
                        FROM categories_situations cs
                        JOIN categories c ON c.id = cs.category_id
                        ORDER BY cs.sort_order`,
    'fellowship-types':    `SELECT id, name FROM fellowship_types ORDER BY sort_order`,
    'management-entities': `SELECT id, COALESCE(NULLIF(short_name,''), official_name) AS name FROM management_entities ORDER BY sort_order`,
    'funding-agencies':    `SELECT id, official_name AS name FROM funding_agencies ORDER BY sort_order`,
    'url-types': `SELECT id, type_en AS name FROM personal_url_types`,



}

router.get('/:name', async (req, res) => {
    const { name } = req.params

    // Object.hasOwn, not `lookups[name]`: a request for /constructor or
    // /__proto__ would otherwise find inherited properties on the object.
    if (!Object.hasOwn(lookups, name)) {
        return res.status(404).json({ message: 'Unknown lookup.' })
    }

    try {
        const [rows] = await pool.query(lookups[name])
        res.set('Cache-Control', 'public, max-age=3600') // reference data changes rarely
        res.json(rows)
    } catch (err) {
        console.error(`Lookup ${name} error:`, err)
        res.status(500).json({ message: 'Something went wrong.' })
    }
})

export default router