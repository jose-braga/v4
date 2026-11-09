import { pool } from '../../../db.js'
//import { notifyExternalApi } from '../../../utils/externalNotifier.js'


export async function getResearcherInfo(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            `SELECT ciencia_id, ORCID, researcherID, scopusID, pure_id
            FROM researchers_info
            WHERE person_id = ?
            LIMIT 1`,
            [personId]
        )
        if (rows.length === 0) {
            return res.json({ workplace: null })
        }
        res.json(rows[0])
    } catch (err) {
        console.error('Fetch research info error:', err)
        res.status(500).json({ message: 'Something went wrong - Researcher Info' })
    }
}

export async function updateResearcherInfo(req, res) {
    const { personId } = req.params
    const { ciencia_id, ORCID, researcherID, scopusID, pure_id } = req.body

    await pool.query(
        `INSERT INTO researchers_info (person_id, ciencia_id, ORCID, researcherID, scopusID, pure_id)
            VALUES (?, ?, ?, ?, ?, ?) as new_row
            ON DUPLICATE KEY UPDATE
                ciencia_id = new_row.ciencia_id,
                ORCID = new_row.ORCID,
                researcherID = new_row.researcherID,
                scopusID = new_row.scopusID,
                pure_id = new_row.pure_id`,
        [personId, ciencia_id, ORCID, researcherID, scopusID, pure_id]
    )
    res.json({ ciencia_id, ORCID, researcherID, scopusID, pure_id })
}