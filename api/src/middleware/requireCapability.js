// middleware/requireCapability.js
import { pool } from '../db.js'
import { getPersonHierarchy, getUnitHierarchy } from '../utils/hierarchy.js'


const hierarchyResolvers = {
    people: getPersonHierarchy,
    units: getUnitHierarchy,
    // later: groups: getGroupHierarchy, etc.
}


export function requireCapability(capability, resourceType, paramName) {
    return async (req, res, next) => {
        const resourceId = req.params[paramName]

        // Self-access shortcut: a person can always act on their own record,
        // without needing an explicit row in the permissions table.
        if (resourceType === 'people' && String(resourceId) === String(req.user.personId)) {
            return next()
        }

        try {

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

            if (rows.length === 0) {
                return res.status(403).json({ message: 'You do not have permission to access or change that resource.' })
            }
            next()
        } catch (err) {
            console.error('Permission check error:', err)
            return res.status(500).json({ message: 'Something went wrong.' })
        }
    }
}