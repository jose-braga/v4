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
