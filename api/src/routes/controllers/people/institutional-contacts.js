import { pool } from '../../../db.js'
//import { notifyExternalApi } from '../../../utils/externalNotifier.js'

async function getPhone(personId) {
    const [rows] = await pool.query(
        `SELECT phone, extension FROM phones WHERE person_id = ?
        LIMIT 1;`,
        [personId]
    )
    if (rows.length === 0) return [null, null];
    return [rows[0].phone, rows[0].extension]
}

async function getEmail(personId) {
    const [rows] = await pool.query(
        `SELECT email FROM emails WHERE person_id = ?
        LIMIT 1;`,
        [personId]
    )
    if (rows.length === 0) return null;
    return rows[0].email
}

export async function getContacts(req, res) {
    const { personId } = req.params
    try {
        const row = {}

        let [ phone, extension ] = await getPhone(personId)
        row.phone = phone
        row.extension = extension
        row.email = await getEmail(personId)
        res.json(row)
    } catch (err) {
        console.error('Fetch institutional contacts error:', err)
        res.status(500).json({ message: 'Something went wrong - Institutional Contacts' })
    }
}

export async function updateContacts(req, res) {
    const { personId } = req.params
    const { phone, extension, email } = req.body

    const conn = await pool.getConnection()

    try {
        await conn.beginTransaction()

        // 1. Update fields on personal_addresses table (using new syntax 8.0.20+)
        await conn.query(
            `INSERT INTO emails (person_id, email)
                VALUES (?, ?) AS new_row
                ON DUPLICATE KEY UPDATE
                    email = new_row.email;`,
            [personId, email]
        )
        await conn.query(
            `INSERT INTO phones (person_id, phone, extension)
                VALUES (?, ?, ?) AS new_row
                ON DUPLICATE KEY UPDATE
                    phone = new_row.phone,
                    extension = new_row.extension;`,
            [personId, phone, extension]
        )


        await conn.commit()
        res.json({ phone, extension, email })
    } catch (err) {
        await conn.rollback()
        console.error('Update institutional contacts error:', err)
        res.status(500).json({ message: 'Error updating institutional contacts.' })
    } finally {
        conn.release()
    }
}
