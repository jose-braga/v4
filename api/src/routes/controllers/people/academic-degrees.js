import { pool } from '../../../db.js'
import { saveRow, deleteMissing } from '../../../utils/sync.js'
import { notifyExternalApi } from '../../../utils/externalNotifier.js'

const DEGREE_COLS = ['degree_id', 'program', 'area', 'institution', 'title', 'start', 'estimate_end', 'end']
const SUP_COLS = ['supervisor_type_id', 'supervisor_id', 'valid_from', 'valid_until']
const EXT_COLS = ['supervisor_type_id', 'colloquial_name', 'organization', 'valid_from', 'valid_until']
const q = (c) => `\`${c}\``


// Helper function to fetch full academic degrees for a person
async function fetchAcademicDegrees(personId) {
    const [degrees] = await pool.query(
        `SELECT id, degree_id, program, area, institution, title, \`start\`, estimate_end, \`end\`
        FROM degrees_people WHERE person_id = ?
        ORDER BY \`end\` IS NOT NULL, \`start\` DESC`,
        [personId]
    )

    if (degrees.length === 0) return []
    const ids = degrees.map((d) => d.id)

    const [sup] = await pool.query(
        `SELECT id, degree_person_id, supervisor_type_id, supervisor_id, valid_from, valid_until
        FROM degrees_supervisors WHERE degree_person_id IN (?) ORDER BY valid_from, id`, [ids])
    const [ext] = await pool.query(
        `SELECT id, degree_person_id, supervisor_type_id, colloquial_name, organization, valid_from, valid_until
        FROM degrees_external_supervisors WHERE degree_person_id IN (?) ORDER BY valid_from, id`, [ids])

    const childrenOf = (rows, degreeId) =>
        rows.filter((r) => r.degree_person_id === degreeId).map(({ degree_person_id, ...rest }) => rest)

    return degrees.map((d) => ({
        ...d,
        supervisors: childrenOf(sup, d.id),
        external_supervisors: childrenOf(ext, d.id),
    }))
}

export async function getAcademicDegrees(req, res) {
    const { personId } = req.params
    try {
        const degreesComplete = await fetchAcademicDegrees(personId)
        res.json(degreesComplete)
    } catch (err) {
        console.error('Fetch academic degrees error:', err)
        res.status(500).json({ message: 'Something went wrong - Academic Degrees' })
    }
}

export async function updateAcademicDegrees(req, res) {
    const { personId } = req.params
    const degrees = req.body.degrees

    if (!Array.isArray(degrees)) return res.status(400).json({ message: 'Invalid payload.' })
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        // lock this person's degrees so two simultaneous saves can't interleave
        const [existing] = await conn.query(
            'SELECT id FROM degrees_people WHERE person_id = ? FOR UPDATE', [personId])
        const existingIds = new Set(existing.map((r) => r.id))

        for (const d of degrees) {
            if (d.id !== undefined && !existingIds.has(d.id)) fail('Unknown degree.')
        }
        // 1. delete degrees that were removed (children first)
        const keep = new Set(degrees.filter((d) => d.id !== undefined).map((d) => d.id))
        const removed = [...existingIds].filter((id) => !keep.has(id))
        if (removed.length) {
            await conn.query('DELETE FROM degrees_supervisors WHERE degree_person_id IN (?)', [removed])
            await conn.query('DELETE FROM degrees_external_supervisors WHERE degree_person_id IN (?)', [removed])
            await conn.query('DELETE FROM degrees_people WHERE id IN (?) AND person_id = ?', [removed, personId])
        }
        // 2. update / insert each degree, then sync its supervisors
        for (const d of degrees) {
            const isNew = d.id === undefined
            const degreeId = await saveRow(conn, 'degrees_people', 'person_id', personId, d, DEGREE_COLS)

            for (const [table, rows, cols] of [
                ['degrees_supervisors', d.supervisors, SUP_COLS],
                ['degrees_external_supervisors', d.external_supervisors, EXT_COLS],
            ]) {
                // a brand-new degree cannot have existing children: ignore any ids sent
                const clean = rows.map((r) => (isNew ? { ...r, id: undefined } : r))
                await deleteMissing(conn, table, 'degree_person_id', degreeId,
                    clean.filter((r) => r.id !== undefined).map((r) => r.id))
                for (const r of clean) {
                    await saveRow(conn, table, 'degree_person_id', degreeId, r, cols)
                }
            }
        }
        notifyExternalApi('update', 'people', personId)
        await conn.commit()
    } catch (err) {
        await conn.rollback()
        console.error(err)
        return res.status(500).json({ message: 'Something went wrong - Academic Degrees' })
    } finally {
        conn.release()
    }
    try {
        const updatedDegrees = await fetchAcademicDegrees(personId)
        return res.status(200).json(updatedDegrees)
    } catch (err) {
        console.error('Reload jobs error:', err)
        res.status(500).json({ message: 'Degrees: Saved, but could not reload the data.' })
    }
}
