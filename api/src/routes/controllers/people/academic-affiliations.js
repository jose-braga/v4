import { pool } from '../../../db.js'
//import { notifyExternalApi } from '../../../utils/externalNotifier.js'

export async function getAcademicAffiliations(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            `SELECT id, department_id AS institution_id, valid_from, valid_until
             FROM people_departments
             WHERE person_id = ?
             ORDER BY valid_from DESC`,
            [personId]
        )
        res.json(rows)
    } catch (err) {
        console.error('Fetch academic affiliations error:', err)
        res.status(500).json({ message: 'Something went wrong - Academic Affiliations' })
    }
}

export async function updateAcademicAffiliations(req, res) {
    const { personId } = req.params
    const rows = req.body.affiliations

    if (!Array.isArray(rows)) return res.status(400).json({ message: 'Invalid payload.' })

    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        // 1. delete this person's rows that are not in the payload
        const keepIds = rows.filter(r => r.id).map(r => r.id)
        if (keepIds.length) {
            await conn.query(
                'DELETE FROM people_departments WHERE person_id = ? AND id NOT IN (?)',
                [personId, keepIds]
            )
        } else {
            await conn.query('DELETE FROM people_departments WHERE person_id = ?', [personId])
        }

        // 2. update existing rows, insert new ones
        for (const r of rows) {
            if (r.id) {
                await conn.query(
                    `UPDATE people_departments
                        SET department_id = ?, valid_from = ?, valid_until = ?
                        WHERE id = ? AND person_id = ?`,
                    [r.institution_id, r.valid_from, r.valid_until, r.id, personId]
                )
            } else {
                await conn.query(
                    `INSERT INTO people_departments (person_id, department_id, valid_from, valid_until)
                        VALUES (?, ?, ?, ?)`,
                    [personId, r.institution_id, r.valid_from, r.valid_until]
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
        `SELECT id, department_id AS institution_id, valid_from, valid_until
         FROM people_departments
         WHERE person_id = ?
         ORDER BY valid_from DESC`,
        [personId]
    )
    res.json(saved)
}

export async function getWorkplaces(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            `SELECT workplace FROM workplaces WHERE person_id = ? LIMIT 1`,
            [personId]
        )
        if (rows.length === 0) {
            return res.json({ workplace: null })
        }
        res.json(rows[0])
    } catch (err) {
        console.error('Fetch work placements error:', err)
        res.status(500).json({ message: 'Something went wrong - Work Placements' })
    }
}

export async function updateWorkplaces(req, res) {
    const { personId } = req.params
    const workplace = typeof req.body.workplace === 'string' ? req.body.workplace.trim() : null
    if (workplace === null) {
        return res.status(400).json({ message: 'Invalid workplace.' })
    }
    if (workplace.length > 200) {
        return res.status(400).json({ message: 'Workplace is too long.' })
    }

    if (workplace === '') {
        // an empty value means "no workplace": remove the row
        await pool.query('DELETE FROM workplaces WHERE person_id = ?', [personId])
    } else {
        await pool.query(
            `INSERT INTO workplaces (person_id, workplace) VALUES (?, ?)
                ON DUPLICATE KEY UPDATE workplace = VALUES(workplace)`,
            [personId, workplace]
        )
    }
    res.json({ workplace })

}