import { pool } from '../../../db.js'
import { notifyExternalApi } from '../../../utils/externalNotifier.js'



export async function getResearchInterests(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            `SELECT id, interests AS research_interest, sort_order
             FROM research_interests
             WHERE person_id = ?
             ORDER BY sort_order ASC`,
            [personId]
        )
        res.json(rows)
    } catch (err) {
        console.error('Fetch research interests error:', err)
        res.status(500).json({ message: 'Something went wrong - Research Interests' })
    }
}

export async function updateResearchInterests(req, res) {
    const { personId } = req.params
    const rows = req.body.research_interests

    if (!Array.isArray(rows)) return res.status(400).json({ message: 'Invalid payload.' })

    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        // 1. delete this person's rows that are not in the payload
        const keepIds = rows.filter(r => r.id).map(r => r.id)
        if (keepIds.length) {
            await conn.query(
                'DELETE FROM research_interests WHERE person_id = ? AND id NOT IN (?)',
                [personId, keepIds]
            )
        } else {
            await conn.query('DELETE FROM research_interests WHERE person_id = ?', [personId])
        }

        // 2. update existing rows, insert new ones
        for (const r of rows) {
            if (r.id) {
                await conn.query(
                    `UPDATE research_interests
                        SET interests = ?, sort_order = ?
                        WHERE id = ? AND person_id = ?`,
                    [r.research_interest, r.sort_order, r.id, personId]
                )
            } else {
                await conn.query(
                    `INSERT INTO research_interests (person_id, interests, sort_order)
                        VALUES (?, ?, ?)`,
                    [personId, r.research_interest, r.sort_order]
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
        `SELECT id, interests AS research_interest, sort_order
         FROM research_interests
         WHERE person_id = ?
         ORDER BY sort_order ASC`,
        [personId]
    )
    notifyExternalApi('update', 'people', personId)
    res.json(saved)

}
