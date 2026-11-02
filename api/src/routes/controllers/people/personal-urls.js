import { pool } from '../../../db.js'
import { notifyExternalApi } from '../../../utils/externalNotifier.js'

export async function getPersonalUrls(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            `SELECT id, url_type_id, url, description
             FROM personal_urls
             WHERE person_id = ?`,
            [personId]
        )
        res.json(rows)
    } catch (err) {
        console.error('Fetch personal URLs error:', err)
        res.status(500).json({ message: 'Something went wrong - Personal URLs' })
    }
}

export async function updatePersonalUrls(req, res) {
    const { personId } = req.params
    const rows = req.body.urls

    if (!Array.isArray(rows)) return res.status(400).json({ message: 'Invalid payload.' })

    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        // 1. delete this person's rows that are not in the payload
        const keepIds = rows.filter(r => r.id).map(r => r.id)
        if (keepIds.length) {
            await conn.query(
                'DELETE FROM personal_urls WHERE person_id = ? AND id NOT IN (?)',
                [personId, keepIds]
            )
        } else {
            await conn.query('DELETE FROM personal_urls WHERE person_id = ?', [personId])
        }

        // 2. update existing rows, insert new ones
        for (const r of rows) {
            if (r.id) {
                await conn.query(
                    `UPDATE personal_urls
                        SET url_type_id = ?, description = ?, url = ?
                        WHERE id = ? AND person_id = ?`,
                    [r.url_type_id, r.description, r.url, r.id, personId]
                )
            } else {
                await conn.query(
                    `INSERT INTO personal_urls (person_id, url_type_id, description, url)
                        VALUES (?, ?, ?, ?)`,
                    [personId, r.url_type_id, r.description, r.url]
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
        `SELECT id, url_type_id, url, description
             FROM personal_urls
             WHERE person_id = ?`,
        [personId]
    )
    res.json(saved)
    notifyExternalApi('update', 'people', personId)
}