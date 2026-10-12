import { pool } from '../../../db.js'
import { notifyExternalApi } from '../../../utils/externalNotifier.js'

async function getNationalities(personId) {
    const [rows] = await pool.query(
        `SELECT country_id FROM people_countries WHERE person_id = ?;`,
        [personId]
    )
    return rows.map((r) => r.country_id)
}

export async function getCoreInformation(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            `SELECT name, colloquial_name, gender, birth_date
             FROM people WHERE id = ?
             LIMIT 1`,
            [personId]
        )
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Person not found.' })
        }

        rows[0].nationalities = await getNationalities(personId)
        res.json(rows[0])
    } catch (err) {
        console.error('Fetch core information error:', err)
        res.status(500).json({ message: 'Something went wrong - Core Information' })
    }
}

export async function updateCoreInformation(req, res) {
    const { personId } = req.params
    const { name, colloquial_name, gender, birth_date, nationalities= [] } = req.body

    const conn = await pool.getConnection()

    try {
        await conn.beginTransaction()

        // 1. Update core fields on people table
        await conn.query(
            `UPDATE people
                SET name = ?, colloquial_name = ?, gender = ?, birth_date = ?
                WHERE id = ?`,
            [name, colloquial_name, gender, birth_date || null, personId]
        )

        // 2. Sync nationalities in people_countries table
        await conn.query(`DELETE FROM people_countries WHERE person_id = ?`, [personId])

        if (nationalities.length > 0) {
            const values = nationalities.map((countryId) => [personId, countryId])
            await conn.query(
                `INSERT INTO people_countries (person_id, country_id) VALUES ?`,
                [values]
            )
        }

        await conn.commit()

        // 3. Return updated object matching CoreInformationPayload interface
        const [rows] = await pool.query(
            `SELECT name, colloquial_name, gender, birth_date
                FROM people WHERE id = ? LIMIT 1`,
            [personId]
        )

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Person not found.' })
        }

        rows[0].nationalities = await getNationalities(personId)
        res.json(rows[0])
        notifyExternalApi('update', 'people', personId)
    } catch (err) {
        await conn.rollback()
        console.error('Update core information error:', err)
        res.status(500).json({ message: 'Something went wrong.' })
    } finally {
        conn.release()
    }
}
