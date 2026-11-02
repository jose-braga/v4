import { pool } from '../../../db.js'

export async function getShortCv(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            `SELECT text AS shortCv FROM website_texts
                WHERE person_id = ? AND text_type_id = 1
                LIMIT 1`,
            [personId]
        )
        if (rows.length === 0) {
            return res.json({ "shortCv": null })
        }
        res.json(rows[0])
    } catch (err) {
        console.error('Fetch short CV error:', err)
        res.status(500).json({ message: 'Something went wrong - Short CV' })
    }
}

export async function updateShortCv(req, res) {
    const { personId } = req.params
    const shortCv = typeof req.body.shortCv === 'string' ? req.body.shortCv.trim() : null
    if (shortCv === null) {
        return res.status(400).json({ message: 'Invalid short CV.' })
    }
    if (shortCv.length > 2000) {
        return res.status(400).json({ message: 'Short CV is too long.' })
    }

    if (shortCv === '') {
        // an empty value means "no Cv": remove the row
        await pool.query('DELETE FROM website_texts WHERE person_id = ? AND text_type_id = 1',
            [personId])
    } else {
        await pool.query(
            `INSERT INTO website_texts (person_id, text_type_id, text)
                VALUES (?, 1, ?)
                ON DUPLICATE KEY UPDATE text = VALUES(text)`,
            [personId, shortCv]
        )
    }
    res.json({ shortCv })

}