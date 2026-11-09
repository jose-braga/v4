// middleware/requireCapability.js
import { pool } from '../db.js'
import { getPersonHierarchy, getUnitHierarchy } from '../utils/hierarchy.js'

const MANAGER_CAPABILITIES_ID = 1
const MANAGER_RES_TYPE_ID = 2

const hierarchyResolvers = {
    people: getPersonHierarchy,
    units: getUnitHierarchy,
    // later: groups: getGroupHierarchy, etc.
}

export async function isUnassigned(personId) {
    try {
        const [rows] = await pool.query(
            `SELECT 1 FROM people_labs WHERE person_id = ?
            UNION
            SELECT 1 FROM technicians_units
                JOIN technicians ON technicians.id = technicians_units.technician_id
                WHERE technicians.person_id = ?
            UNION
            SELECT 1 FROM science_managers_units
                JOIN science_managers ON science_managers.id = science_managers_units.science_manager_id
                WHERE science_managers.person_id = ?
            UNION
            SELECT 1 FROM people_administrative_units
                JOIN people_administrative_offices ON people_administrative_offices.id = people_administrative_units.administrative_id
                WHERE people_administrative_offices.person_id = ?
            LIMIT 1`,
            [personId, personId, personId, personId]
        )
        return rows.length === 0

    } catch (err) {
        console.error('Permission check error:', err)
        return false

    }
}

async function isUnitManager(req, res) {
    // Implementation for checking if person lab data is editable by the current user.
    try {
        const [rows] = await pool.query(
            `SELECT *
             FROM permissions_control
             WHERE capability_id = ? AND resource_type_id = ? AND user_id = ?`,
            [MANAGER_CAPABILITIES_ID, MANAGER_RES_TYPE_ID, req.user.id]
        )
        if (rows.length > 0) {
            return true
        }
        return false
    } catch (err) {
        console.error('Permission check error:', err)
        res.status(500).json({ message: 'Something went wrong - permissions check' })
        return false
    }

}

export function requireCapability(capability, resourceType, paramName, { allowSelf = true } = {}) {
    return async (req, res, next) => {
        const resourceId = req.params[paramName]

        // Self-access shortcut: a person can always act on their own record,
        // without needing an explicit row in the permissions table.
        if (allowSelf && resourceType === 'people'
            && String(resourceId) === String(req.user.personId)) {
            return next()
        }

        try {
            // this works for people with labs assigned
            const resolver = hierarchyResolvers[resourceType]
            const chain = resolver ? await resolver(resourceId) : [{ resourceType, resourceId }]

            if (chain.length === 0) {
                return res.status(404).json({ message: 'Resource not found.' })
            }

            const conditions = chain
                .map(() => `(permissions_resource_types.resource_name = ? AND
                (permissions_control.resource_id = ? OR permissions_control.resource_id IS NULL))`)
                .join(' OR ')

            const params = chain.flatMap((c) => [c.resourceType, c.resourceId])

            //console.log('Capability:', capability)
            //console.log('Resource chain for', resourceType)
            //console.log(resourceId)
            //console.log(chain)
            //console.log('Conditions & Params:')
            //console.log(conditions)
            //console.log(params)

            const [rows] = await pool.query(
                `SELECT 1
                FROM permissions_control
                JOIN permissions_resource_types ON permissions_control.resource_type_id = permissions_resource_types.id
                JOIN capabilities ON permissions_control.capability_id = capabilities.id
                 WHERE permissions_control.user_id = ? AND capabilities.capability = ?
                 AND (${conditions})
                 LIMIT 1`,
                [req.user.id, capability, ...params]
            )
            //console.log('Permission check result:', rows)
            if (rows.length === 0) {
                if (resourceType === 'people' && await isUnassigned(resourceId)
                    && await isUnitManager(req, res) ) {
                    return next()
                }
                return res.status(403).json({ message: 'You do not have permission to access or change that resource.' })
            }
            next()
        } catch (err) {
            console.error('Permission check error:', err)
            return res.status(500).json({ message: 'Something went wrong.' })
        }
    }
}