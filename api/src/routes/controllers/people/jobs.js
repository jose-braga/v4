import { pool } from '../../../db.js'
import { saveRow, deleteMissing } from '../../../utils/sync.js'
import { notifyExternalApi } from '../../../utils/externalNotifier.js'

const JOB_COLS = [
    'category_situation_id', 'organization', 'dedication', 'valid_from', 'valid_until',
    'funding_agency_id', 'management_entity_id', 'is_fellowship', 'other_data',
]

async function fetchJobs(personId) {
    const [rows] = await pool.query(
        `SELECT j.id, cs.situation_id, j.category_situation_id, j.organization, j.dedication,
                j.valid_from, j.valid_until, j.funding_agency_id, j.management_entity_id,
                j.is_fellowship, j.other_data
         FROM jobs j
         JOIN categories_situations cs ON cs.id = j.category_situation_id
         WHERE j.person_id = ?
         ORDER BY j.valid_until IS NOT NULL, j.valid_from DESC`,   // current first, then newest
        [personId]
    )
    return rows.map((r) => ({ ...r, is_fellowship: !!r.is_fellowship }))
}

export async function getJobs(req, res) {
    const { personId } = req.params
    try {
        const jobsComplete = await fetchJobs(personId)
        res.json(jobsComplete)
    } catch (err) {
        console.error('Fetch jobs error:', err)
        res.status(500).json({ message: 'Something went wrong - Jobs' })
    }
}

export async function updateJobs(req, res) {
    const { personId } = req.params
    const jobs = req.body.jobs

    if (!Array.isArray(jobs)) return res.status(400).json({ message: 'Invalid payload.' })
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        // lock this person's jobs so two simultaneous saves can't interleave
        const [existing] = await conn.query(
            `SELECT id FROM jobs WHERE person_id = ? FOR UPDATE`, [personId]
        )
        const existingIds = new Set(existing.map((r) => r.id))
        console.log('Existing job IDs:', existingIds)
        for (const j of jobs) {
            if (j.id !== undefined && !existingIds.has(j.id)) fail('Unknown job.')
        }

        // delete what was removed, update/insert the rest
        await deleteMissing(conn, 'jobs', 'person_id', personId,
            jobs.filter((j) => j.id !== undefined).map((j) => j.id))
        for (const j of jobs) {
            await saveRow(conn, 'jobs', 'person_id', personId, j, JOB_COLS)
        }
        notifyExternalApi('update', 'people', personId)
        await conn.commit()
    } catch (err) {
        await conn.rollback()
        console.error(err)
        return res.status(500).json({ message: 'Something went wrong - Jobs' })
    } finally {
        conn.release()
    }

    try {
        const updatedJobs = await fetchJobs(personId)
        return res.status(200).json(updatedJobs)
    } catch (err) {
        console.error('Reload jobs error:', err)
        res.status(500).json({ message: 'Professional Situations: Saved, but could not reload the data.' })
    }


}