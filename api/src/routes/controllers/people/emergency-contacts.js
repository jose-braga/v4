import { pool } from '../../../db.js'

export async function getEmergencyContacts(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            `SELECT id, name, phone
             FROM emergency_contacts
             WHERE person_id = ?`,
            [personId]
        )
        res.json(rows)
    } catch (err) {
        console.error('Fetch emergency contacts error:', err)
        res.status(500).json({ message: 'Something went wrong - Emergency Contacts' })
    }
}

export async function updateEmergencyContacts(req, res) {
    const { personId } = req.params
    const rows = req.body.contacts

    if (!Array.isArray(rows)) return res.status(400).json({ message: 'Invalid payload.' })

    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        // 1. delete this person's rows that are not in the payload
        const keepIds = rows.filter(r => r.id).map(r => r.id)
        if (keepIds.length) {
            await conn.query(
                'DELETE FROM emergency_contacts WHERE person_id = ? AND id NOT IN (?)',
                [personId, keepIds]
            )
        } else {
            await conn.query('DELETE FROM emergency_contacts WHERE person_id = ?', [personId])
        }

        // 2. update existing rows, insert new ones
        for (const r of rows) {
            if (r.id) {
                await conn.query(
                    `UPDATE emergency_contacts
                        SET name = ?, phone = ?
                        WHERE id = ? AND person_id = ?`,
                    [r.name, r.phone, r.id, personId]
                )
            } else {
                await conn.query(
                    `INSERT INTO emergency_contacts (person_id, name, phone)
                        VALUES (?, ?, ?)`,
                    [personId, r.name, r.phone]
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
        `SELECT id, name, phone
             FROM emergency_contacts
             WHERE person_id = ?`,
        [personId]
    )
    res.json(saved)
}