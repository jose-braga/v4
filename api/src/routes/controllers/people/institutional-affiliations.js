import { pool } from '../../../db.js'
import { isUnassigned } from '../../../middleware/requireCapability.js'
import { notifyExternalApi } from '../../../utils/externalNotifier.js'

const EDITABLE_CAPABILITIES_ID = 1
const EDITABLE_RES_TYPE_ID = 2

async function isEditable(req, res) {
    // Implementation for checking if person lab data is editable by the current user.
    // We only get here if user has a row in permissions_control for this person
    try {
        const [rows] = await pool.query(
            `SELECT *
             FROM permissions_control
             WHERE capability_id = ? AND resource_type_id = ? AND user_id = ?`,
            [EDITABLE_CAPABILITIES_ID, EDITABLE_RES_TYPE_ID, req.user.id]
        )
        if (rows.length > 0) {
            return true
        }
        return false
    } catch (err) {
        console.error('Fetch Institutional Affiliations error:', err)
        return false
    }

}

async function unitsWithCapability(userId) {
    const [rows] = await pool.query(
        `SELECT resource_id
           FROM permissions_control
          WHERE capability_id = ? AND resource_type_id = ? AND user_id = ?`,
        [EDITABLE_CAPABILITIES_ID, EDITABLE_RES_TYPE_ID, userId]
    )
    return rows.map((r) => r.resource_id)
}

const CAP = 'edit_people_data'

class HttpError extends Error {
    constructor(status, message) { super(message); this.status = status }
}

// ---- Labs ------------------------------------------------------------------
const LAB_FIELDS = ['lab_id', 'lab_position_id', 'dedication', 'valid_from', 'valid_until',
                    'integrated', 'pluriannual', 'nuclearCV']
const labChanged = (old, r) => LAB_FIELDS.some((f) => old[f] !== r[f])

// units a lab belongs to, either today or at any time in its history
async function unitsOfLabs(conn, labIds, onlyCurrent) {
    const ids = [...labIds]
    const map = new Map()
    if (ids.length === 0) return map
    const current = onlyCurrent
        ? ` AND (lg.valid_from  IS NULL OR lg.valid_from  <= CURDATE())
            AND (lg.valid_until IS NULL OR lg.valid_until >= CURDATE())
            AND (gu.valid_from  IS NULL OR gu.valid_from  <= CURDATE())
            AND (gu.valid_until IS NULL OR gu.valid_until >= CURDATE())`
        : ''
    const [rows] = await conn.query(
        `SELECT lg.lab_id, gu.unit_id
           FROM labs_groups lg JOIN groups_units gu ON gu.group_id = lg.group_id
          WHERE lg.lab_id IN (?)${current}`,
        [ids],
    )
    for (const r of rows) {
        if (!map.has(r.lab_id)) map.set(r.lab_id, new Set())
        map.get(r.lab_id).add(r.unit_id)
    }
    return map
}

// Labs being newly assigned must belong to a unit the manager manages today.
// Rows being changed or removed are judged by the lab they currently point to,
// in any period of its history, so old affiliations stay editable.
async function assertLabsManageable(conn, user, unassigned, newLabs, oldLabs) {
    if (unassigned) return                      // unassigned people can be placed in any lab
    const managed = new Set(await unitsWithCapability(user.id))
    for (const [labs, onlyCurrent] of [[newLabs, true], [oldLabs, false]]) {
        const map = await unitsOfLabs(conn, labs, onlyCurrent)
        for (const labId of labs) {
            const units = map.get(labId)
            if (!units || ![...units].some((u) => managed.has(u))) {
                throw new HttpError(403, 'You can only change affiliations with labs in units you manage.')
            }
        }
    }
}

// ---- Offices ---------------------------------------------------------------
// table and column names come only from this constant, never from the request
const OFFICE_KINDS = {
    technician: {
        table: 'technicians', office: 'technician_office_id', position: 'technician_position_id',
        units: 'technicians_units', fk: 'technician_id',
    },
    science_manager: {
        table: 'science_managers', office: 'science_manager_office_id', position: 'science_manager_position_id',
        units: 'science_managers_units', fk: 'science_manager_id',
    },
    administrative: {
        table: 'people_administrative_offices', office: 'administrative_office_id', position: 'administrative_position_id',
        units: 'people_administrative_units', fk: 'administrative_id',
    },
}

const FIELDS = ['office_id', 'position_id', 'unit_id', 'dedication', 'valid_from', 'valid_until']
const changed = (old, r) => FIELDS.some((f) => old[f] !== r[f])

async function assertUnitsManaged(user, unassigned, unitIds) {
    if (unassigned || unitIds.size === 0) return              // unassigned people can be placed in any unit
    const managed = new Set(await unitsWithCapability(user.id))
    for (const unitId of unitIds) {
        if (!managed.has(unitId)) throw new HttpError(403, 'You can only change affiliations with units you manage.')
    }
}

async function writeKind(conn, personId, cfg, existing, keep, rows) {
    // delete rows missing from the payload (junction rows first)
    const gone = existing.filter((e) => !keep.has(e.id)).map((e) => e.id)
    if (gone.length) {
        await conn.query(`DELETE FROM ${cfg.units} WHERE ${cfg.fk} IN (?)`, [gone])
        await conn.query(`DELETE FROM ${cfg.table} WHERE person_id = ? AND id IN (?)`, [personId, gone])
    }
    for (const r of rows) {
        let id = r.id
        if (id !== undefined) {
            await conn.query(
                `UPDATE ${cfg.table}
                    SET ${cfg.office} = ?, ${cfg.position} = ?, dedication = ?, valid_from = ?, valid_until = ?
                  WHERE id = ? AND person_id = ?`,
                [r.office_id, r.position_id, r.dedication, r.valid_from, r.valid_until, id, personId],
            )
            await conn.query(`DELETE FROM ${cfg.units} WHERE ${cfg.fk} = ?`, [id])
        } else {
            const [ins] = await conn.query(
                `INSERT INTO ${cfg.table} (person_id, ${cfg.office}, ${cfg.position}, dedication, valid_from, valid_until)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [personId, r.office_id, r.position_id, r.dedication, r.valid_from, r.valid_until],
            )
            id = ins.insertId
        }
        await conn.query(`INSERT INTO ${cfg.units} (${cfg.fk}, unit_id) VALUES (?, ?)`, [id, r.unit_id])
    }
}



export async function getPoles(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            `SELECT id, city_id AS pole_id, valid_from, valid_until
             FROM people_institution_city
             WHERE person_id = ?
             ORDER BY valid_from DESC`,
            [personId]
        )
        res.json(rows)
    } catch (err) {
        console.error('Fetch poles error:', err)
        res.status(500).json({ message: 'Something went wrong - Poles' })
    }
}

export async function updatePoles(req, res) {
    const { personId } = req.params
    const rows = req.body.poles

    if (!Array.isArray(rows)) return res.status(400).json({ message: 'Invalid payload.' })

    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        // 1. delete this person's rows that are not in the payload
        const keepIds = rows.filter(r => r.id).map(r => r.id)
        if (keepIds.length) {
            await conn.query(
                'DELETE FROM people_institution_city WHERE person_id = ? AND id NOT IN (?)',
                [personId, keepIds]
            )
        } else {
            await conn.query('DELETE FROM people_institution_city WHERE person_id = ?', [personId])
        }

        // 2. update existing rows, insert new ones
        for (const r of rows) {
            if (r.id) {
                await conn.query(
                    `UPDATE people_institution_city
                        SET city_id = ?, valid_from = ?, valid_until = ?
                        WHERE id = ? AND person_id = ?`,
                    [r.pole_id, r.valid_from, r.valid_until, r.id, personId]
                )
            } else {
                await conn.query(
                    `INSERT INTO people_institution_city (person_id, city_id, valid_from, valid_until)
                        VALUES (?, ?, ?, ?)`,
                    [personId, r.pole_id, r.valid_from, r.valid_until]
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
        `SELECT id, city_id AS pole_id, valid_from, valid_until
         FROM people_institution_city
         WHERE person_id = ?
         ORDER BY valid_from DESC`,
        [personId]
    )
    res.json(saved)

}

async function loadAffiliations(db, personId) {
    const [lab_data] = await db.query(
        `SELECT pl.*, lp.name_en AS lab_position_name,
                l.name AS lab_name, g.id AS group_id, g.name AS group_name,
                u.id AS unit_id, u.short_name AS unit_name
            FROM (SELECT p.*,
                        LEAST(COALESCE(p.valid_until, CURDATE()), CURDATE()) AS ref
                    FROM people_labs p
                    WHERE p.person_id = ?) pl
            LEFT JOIN lab_positions lp ON pl.lab_position_id = lp.id
            JOIN labs l ON l.id = pl.lab_id
            LEFT JOIN labs_groups lg ON lg.lab_id = pl.lab_id
                    AND (lg.valid_from  IS NULL OR lg.valid_from  <= pl.ref)
                    AND (lg.valid_until IS NULL OR lg.valid_until >= pl.ref)
            LEFT JOIN \`groups\` g ON g.id = lg.group_id
            LEFT JOIN groups_units gu ON gu.group_id = g.id
                    AND (gu.valid_from  IS NULL OR gu.valid_from  <= pl.ref)
                    AND (gu.valid_until IS NULL OR gu.valid_until >= pl.ref)
            LEFT JOIN units u ON u.id = gu.unit_id
            ORDER BY pl.valid_until IS NOT NULL, pl.valid_from DESC;`,
        [personId]
    )
    const [technician_data] = await db.query(
        `SELECT t.*, tp.name_en AS technician_position_name,
            tof.name_en AS technician_office_name, tu.unit_id, u.short_name AS unit_name
            FROM technicians t
            JOIN technician_offices tof ON tof.id = t.technician_office_id
            JOIN technicians_units tu ON tu.technician_id = t.id
            JOIN units u ON u.id = tu.unit_id
            LEFT JOIN technician_positions tp ON tp.id = t.technician_position_id
            WHERE t.person_id = ?
            ORDER BY t.valid_until IS NOT NULL, t.valid_from DESC;`,
        [personId]
    )
    const [science_manager_data] = await db.query(
        `SELECT sm.*, smp.name_en AS science_manager_position_name,
            smof.name_en AS science_manager_office_name, smu.unit_id, u.short_name AS unit_name
            FROM science_managers sm
            JOIN science_manager_offices smof ON smof.id = sm.science_manager_office_id
            JOIN science_managers_units smu ON smu.science_manager_id = sm.id
            JOIN units u ON u.id = smu.unit_id
            LEFT JOIN science_manager_positions smp ON smp.id = sm.science_manager_position_id
            WHERE sm.person_id = ?
            ORDER BY sm.valid_until IS NOT NULL, sm.valid_from DESC;`,
        [personId]
    )
    const [administrative_data] = await db.query(
        `SELECT a.*, ap.name_en AS administrative_position_name,
            aof.name_en AS administrative_office_name, au.unit_id, u.short_name AS unit_name
            FROM people_administrative_offices a
            JOIN administrative_offices aof ON aof.id = a.administrative_office_id
            JOIN people_administrative_units au ON au.administrative_id = a.id
            JOIN units u ON u.id = au.unit_id
            LEFT JOIN administrative_positions ap ON ap.id = a.administrative_position_id
            WHERE a.person_id = ?
            ORDER BY a.valid_until IS NOT NULL, a.valid_from DESC;`,
        [personId]
    )
    return { lab_data, technician_data, science_manager_data, administrative_data }
}

export async function getPersonLabs(req, res) {
    const { personId } = req.params
    try {
        res.json({
            ...(await loadAffiliations(pool, personId)),
            editable: await isEditable(req, res)
        })
    } catch (err) {
        console.error('Fetch Institutional Affiliations:', err)
        res.status(500).json({ message: 'Something went wrong - Institutional Affiliations' })
    }
}

export async function updatePersonLabs(req, res) {
    const { personId } = req.params
    const rows = req.body.labs

    if (!Array.isArray(rows)) return res.status(400).json({ message: 'Invalid payload.' })

    let conn, saved
    try {
        conn = await pool.getConnection()
        await conn.beginTransaction()
        const unassigned = await isUnassigned(personId)       // decided before any change

        const [existingRaw] = await conn.query(
            `SELECT id, lab_id, lab_position_id, dedication,
                    DATE_FORMAT(valid_from,  '%Y-%m-%d') AS valid_from,
                    DATE_FORMAT(valid_until, '%Y-%m-%d') AS valid_until,
                    integrated, pluriannual, nuclearCV
               FROM people_labs WHERE person_id = ? FOR UPDATE`,
            [personId],
        )
        const existing = existingRaw.map((r) => ({
            ...r, integrated: !!r.integrated, pluriannual: !!r.pluriannual, nuclearCV: !!r.nuclearCV,
        }))
        const byId = new Map(existing.map((r) => [r.id, r]))

        const newLabs = new Set()      // labs the person is being assigned to
        const oldLabs = new Set()      // labs of rows being changed or removed
        const keep = new Set()
        for (const r of rows) {
            if (r.id === undefined) { newLabs.add(r.lab_id); continue }
            const old = byId.get(r.id)
            if (!old) throw new HttpError(400, 'Unknown affiliation.')
            keep.add(r.id)
            if (labChanged(old, r)) {
                oldLabs.add(old.lab_id)
                if (r.lab_id !== old.lab_id) newLabs.add(r.lab_id)
            }
        }
        for (const old of existing) if (!keep.has(old.id)) oldLabs.add(old.lab_id)

        await assertLabsManageable(conn, req.user, unassigned, newLabs, oldLabs)

        const keepIds = [...keep]
        if (keepIds.length) {
            await conn.query('DELETE FROM people_labs WHERE person_id = ? AND id NOT IN (?)', [personId, keepIds])
        } else {
            await conn.query('DELETE FROM people_labs WHERE person_id = ?', [personId])
        }
        for (const r of rows) {
            const v = [r.lab_id, r.lab_position_id, r.dedication, r.valid_from, r.valid_until,
                       r.integrated ? 1 : 0, r.pluriannual ? 1 : 0, r.nuclearCV ? 1 : 0]
            if (r.id !== undefined) {
                await conn.query(
                    `UPDATE people_labs
                        SET lab_id = ?, lab_position_id = ?, dedication = ?, valid_from = ?, valid_until = ?,
                            integrated = ?, pluriannual = ?, nuclearCV = ?
                      WHERE id = ? AND person_id = ?`,
                    [...v, r.id, personId],
                )
            } else {
                await conn.query(
                    `INSERT INTO people_labs
                        (lab_id, lab_position_id, dedication, valid_from, valid_until,
                         integrated, pluriannual, nuclearCV, person_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [...v, personId],
                )
            }
        }
        await conn.commit()
        saved = { ...(await loadAffiliations(conn, personId)), editable: true }
    } catch (err) {
        if (conn) await conn.rollback().catch(() => {})
        if (err.status) return res.status(err.status).json({ message: err.message })
        if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Unknown lab or position.' })
        console.error('Update lab positions error:', err)
        return res.status(500).json({ message: 'Something went wrong - updating lab positions' })
    } finally {
        if (conn) conn.release()
    }

    notifyExternalApi('update', 'people', personId)
    res.json(saved)
}

export async function updatePersonOffices(req, res) {
    const { personId } = req.params
    const rows = req.body.offices

    if (!Array.isArray(rows)) return res.status(400).json({ message: 'Invalid payload.' })

    let conn, saved
    try {
        conn = await pool.getConnection()
        await conn.beginTransaction()
        const unassigned = await isUnassigned(personId)       // decided before any change

        const touchedUnits = new Set()
        const plans = []
        for (const [kind, cfg] of Object.entries(OFFICE_KINDS)) {
            const [exRows] = await conn.query(
                `SELECT t.id, t.${cfg.office} AS office_id, t.${cfg.position} AS position_id, t.dedication,
                        DATE_FORMAT(t.valid_from,  '%Y-%m-%d') AS valid_from,
                        DATE_FORMAT(t.valid_until, '%Y-%m-%d') AS valid_until,
                        j.unit_id
                   FROM ${cfg.table} t LEFT JOIN ${cfg.units} j ON j.${cfg.fk} = t.id
                  WHERE t.person_id = ? FOR UPDATE`,
                [personId],
            )
            const byId = new Map()
            for (const e of exRows) {
                if (byId.has(e.id)) throw new HttpError(409, 'A record has several units and must be edited manually.')
                byId.set(e.id, e)
            }
            const keep = new Set()
            const mine = rows.filter((r) => r.kind === kind)
            for (const r of mine) {
                if (r.id === undefined) { touchedUnits.add(r.unit_id); continue }
                const old = byId.get(r.id)
                if (!old) throw new HttpError(400, 'Unknown affiliation.')
                keep.add(r.id)
                if (changed(old, r)) {
                    if (old.unit_id) touchedUnits.add(old.unit_id)
                    touchedUnits.add(r.unit_id)
                }
            }
            for (const e of byId.values()) if (!keep.has(e.id) && e.unit_id) touchedUnits.add(e.unit_id)
            plans.push({ cfg, existing: [...byId.values()], keep, rows: mine })
        }

        await assertUnitsManaged(req.user, unassigned, touchedUnits)
        for (const p of plans) await writeKind(conn, personId, p.cfg, p.existing, p.keep, p.rows)

        await conn.commit()
        saved = { ...(await loadAffiliations(conn, personId)), editable: true }
    } catch (err) {
        if (conn) await conn.rollback().catch(() => {})
        if (err.status) return res.status(err.status).json({ message: err.message })
        if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Unknown office, position or unit.' })
        console.error('Update offices error:', err)
        return res.status(500).json({ message: 'Something went wrong - updating offices' })
    } finally {
        if (conn) conn.release()
    }

    notifyExternalApi('update', 'people', personId)
    res.json(saved)

}