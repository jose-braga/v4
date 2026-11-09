import { pool } from '../../../db.js'

export async function getResponsibles(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            `SELECT id, responsible_id AS supervisor_id, responsible_type_id AS supervisor_type_id,
            valid_from, valid_until
             FROM people_responsibles
             WHERE person_id = ?
             ORDER BY valid_from DESC`,
            [personId]
        )
        res.json(rows)
    } catch (err) {
        console.error('Fetch responsibles error:', err)
        res.status(500).json({ message: 'Something went wrong - Responsibles' })
    }
}

export async function updateResponsibles(req, res) {
    const { personId } = req.params
    const rows = req.body.supervisors

    if (!Array.isArray(rows)) return res.status(400).json({ message: 'Invalid payload.' })

    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        // 1. delete this person's rows that are not in the payload
        const keepIds = rows.filter(r => r.id).map(r => r.id)
        if (keepIds.length) {
            await conn.query(
                'DELETE FROM people_responsibles WHERE person_id = ? AND id NOT IN (?)',
                [personId, keepIds]
            )
        } else {
            await conn.query('DELETE FROM people_responsibles WHERE person_id = ?', [personId])
        }

        // 2. update existing rows, insert new ones
        for (const r of rows) {
            if (r.id) {
                await conn.query(
                    `UPDATE people_responsibles
                        SET responsible_id = ?, responsible_type_id = ?, valid_from = ?, valid_until = ?
                        WHERE id = ? AND person_id = ?`,
                    [r.supervisor_id, r.supervisor_type_id, r.valid_from, r.valid_until, r.id, personId]
                )
            } else {
                await conn.query(
                    `INSERT INTO people_responsibles (person_id, responsible_id, responsible_type_id, valid_from, valid_until)
                        VALUES (?, ?, ?, ?, ?)`,
                    [personId, r.supervisor_id, r.supervisor_type_id, r.valid_from, r.valid_until]
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
        `SELECT id, responsible_id AS supervisor_id, responsible_type_id AS supervisor_type_id,
            valid_from, valid_until
             FROM people_responsibles
             WHERE person_id = ?
             ORDER BY valid_from DESC`,
        [personId]
    )
    res.json(saved)
}

