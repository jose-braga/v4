import { pool } from '../../../db.js'
//import { notifyExternalApi } from '../../../utils/externalNotifier.js'

async function getPhone(personId) {
    const [rows] = await pool.query(
        `SELECT phone FROM personal_phones WHERE person_id = ?
        LIMIT 1;`,
        [personId]
    )
    if (rows.length === 0) return null;
    return rows[0].phone
}

async function getEmail(personId) {
    const [rows] = await pool.query(
        `SELECT email FROM personal_emails WHERE person_id = ?
        LIMIT 1;`,
        [personId]
    )
    if (rows.length === 0) return null;
    return rows[0].email
}

export async function getPersonalContacts(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            `SELECT address, postal_code, city
             FROM personal_addresses
              WHERE person_id = ?
             LIMIT 1`,
            [personId]
        )
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No personal contacts filled yet.' })
        }

        rows[0].phone = await getPhone(personId)
        rows[0].email = await getEmail(personId)
        res.json(rows[0])
    } catch (err) {
        console.error('Fetch personal contacts error:', err)
        res.status(500).json({ message: 'Something went wrong - Personal Contacts' })
    }
}

export async function updatePersonalContacts(req, res) {
    const { personId } = req.params
    const { address, postal_code, city, phone, email } = req.body

    const conn = await pool.getConnection()

    try {
        await conn.beginTransaction()

        // 1. Update fields on personal_addresses table (using new syntax 8.0.20+)
        await conn.query(
            `INSERT INTO personal_addresses (person_id, address, postal_code, city)
                VALUES (?, ?, ?, ?) AS new_row
                ON DUPLICATE KEY UPDATE
                    address = new_row.address,
                    postal_code = new_row.postal_code,
                    city = new_row.city;`,
            [personId, address, postal_code, city]
        )
        await conn.query(
            `INSERT INTO personal_emails (person_id, email)
                VALUES (?, ?) AS new_row
                ON DUPLICATE KEY UPDATE
                    email = new_row.email;`,
            [personId, email]
        )
        await conn.query(
            `INSERT INTO personal_phones (person_id, phone)
                VALUES (?, ?) AS new_row
                ON DUPLICATE KEY UPDATE
                    phone = new_row.phone;`,
            [personId, phone]
        )


        await conn.commit()
        res.json({ address, postal_code, city, phone, email })
    } catch (err) {
        await conn.rollback()
        console.error('Update personal contacts error:', err)
        res.status(500).json({ message: 'Error updating personal contacts.' })
    } finally {
        conn.release()
    }
}
