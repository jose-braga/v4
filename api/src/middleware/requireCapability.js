// middleware/requireCapability.js
import { pool } from '../db.js'

export function requireCapability(capability, resourceType, paramName) {
    return async (req, res, next) => {
        const resourceId = req.params[paramName]

        // Self-access shortcut: a person can always act on their own record,
        // without needing an explicit row in the permissions table.
        if (resourceType === 'people' && String(resourceId) === String(req.user.personId)) {
            return next()
        }

        try {
            const [rows] = await pool.query(
                `SELECT 1
                FROM permissions_control
                JOIN permissions_resource_types ON permissions_control.resource_type_id = permissions_resource_types.id
                 WHERE user_id = ? AND capability = ? AND permissions_resource_types.resource_name = ?
                 AND (resource_id = ? OR resource_id IS NULL)
                 LIMIT 1`,
                [req.user.id, capability, resourceType, resourceId]
            )

            if (rows.length === 0) {
                return res.status(403).json({ message: 'You do not have permission to do that.' })
            }
            next()
        } catch (err) {
            console.error('Permission check error:', err)
            return res.status(500).json({ message: 'Something went wrong.' })
        }
    }
}