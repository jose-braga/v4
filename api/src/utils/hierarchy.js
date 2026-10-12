// permissions/hierarchy.js
import { pool } from '../db.js'

export async function getPersonHierarchy(personId) {
    const [personRows] = await pool.query(
        'SELECT id FROM people WHERE id = ? LIMIT 1',
        [personId]
    )
    if (personRows.length === 0) {
        return [] // person doesn't exist — caller treats this as 404
    }

    const [rows] = await pool.query(
        `SELECT DISTINCT labs.id AS lab_id, \`groups\`.id AS group_id, units.id AS unit_id
         FROM people_labs
         JOIN labs ON labs.id = people_labs.lab_id
         JOIN labs_groups ON labs_groups.lab_id = labs.id
         JOIN  \`groups\` ON labs_groups.group_id = \`groups\`.id
         JOIN groups_units ON groups_units.group_id = \`groups\`.id
         JOIN units ON groups_units.unit_id = units.id
         WHERE people_labs.person_id = ?

         UNION

        SELECT DISTINCT technicians.technician_office_id AS lab_id, NULL AS group_id, units.id AS unit_id
         FROM technicians
         JOIN technician_offices ON technician_offices.id = technicians.technician_office_id
         JOIN technicians_units ON technicians_units.technician_id = technicians.id
         JOIN units ON technicians_units.unit_id = units.id
         WHERE technicians.person_id = ?

         UNION

        SELECT DISTINCT science_managers.science_manager_office_id AS lab_id, NULL AS group_id, units.id AS unit_id
         FROM science_managers
         JOIN science_manager_offices ON science_manager_offices.id = science_managers.science_manager_office_id
         JOIN science_managers_units ON science_managers_units.science_manager_id = science_managers.id
         JOIN units ON science_managers_units.unit_id = units.id
         WHERE science_managers.person_id = ?

         UNION

        SELECT DISTINCT people_administrative_offices.administrative_office_id AS lab_id, NULL AS group_id, units.id AS unit_id
         FROM people_administrative_offices
         JOIN administrative_offices ON administrative_offices.id = people_administrative_offices.administrative_office_id
         JOIN people_administrative_units ON people_administrative_units.administrative_id = people_administrative_offices.id
         JOIN units ON people_administrative_units.unit_id = units.id
         WHERE people_administrative_offices.person_id = ?

         `,
        [personId, personId, personId, personId]
    )

    //console.log('Hierarchy rows for person', personId, rows)

    // Use a Map keyed by "type:id" to naturally dedupe — e.g. two labs
    // sharing the same group would otherwise add that group twice.
    const chain = new Map()
    chain.set(`people:${personId}`, { resourceType: 'people', resourceId: personId })

    for (const row of rows) {
        chain.set(`labs:${row.lab_id}`, { resourceType: 'labs', resourceId: row.lab_id })
        chain.set(`groups:${row.group_id}`, { resourceType: 'groups', resourceId: row.group_id })
        chain.set(`units:${row.unit_id}`, { resourceType: 'units', resourceId: row.unit_id })
    }

    return [...chain.values()]
}

export async function getUnitHierarchy(unitId) {
    // unit is the top level, so just return it
    const [unitRows] = await pool.query(
        'SELECT id FROM units WHERE id = ? LIMIT 1',
        [unitId]
    )
    if (unitRows.length === 0) {
        return [] // unit doesn't exist — caller treats this as 404
    }
    return [{ resourceType: 'units', resourceId: unitId }]
}