import { pool } from '../../../db.js'

export async function getOtherEditors(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            `SELECT id, user_id
             FROM permissions_control
             WHERE capability_id = 1 AND resource_type_id = 1 AND resource_id = ?`,
            [personId]
        )
        res.json(rows)
    } catch (err) {
        console.error('Fetch other editors error:', err)
        res.status(500).json({ message: 'Something went wrong - Other Editors' })
    }
}

export async function updateOtherEditors(req, res) {
    const { personId } = req.params
    const rows = req.body.editors

    if (!Array.isArray(rows)) return res.status(400).json({ message: 'Invalid payload.' })

    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        // 1. delete this person's rows that are not in the payload
        const keepIds = rows.filter(r => r.id).map(r => r.id)
        if (keepIds.length) {
            await conn.query(
                'DELETE FROM permissions_control WHERE resource_id = ? AND id NOT IN (?)',
                [personId, keepIds]
            )
        } else {
            await conn.query('DELETE FROM permissions_control WHERE resource_id = ?', [personId])
        }

        // 2. update existing rows, insert new ones
        for (const r of rows) {
            if (r.id) {
                await conn.query(
                    `UPDATE permissions_control
                        SET user_id = ?
                        WHERE id = ? AND resource_id = ? AND capability_id = 1 AND resource_type_id = 1`,
                    [r.user_id, r.id, personId]
                )
            } else {
                await conn.query(
                    `INSERT INTO permissions_control (resource_id, user_id, capability_id, resource_type_id)
                        VALUES (?, ?, ?, ?)`,
                    [personId, r.user_id, 1, 1]
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
        `SELECT id, user_id
             FROM permissions_control
             WHERE capability_id = 1 AND resource_type_id = 1 AND resource_id = ?`,
        [personId]
    )
    res.json(saved)
}