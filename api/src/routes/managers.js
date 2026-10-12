import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireCapability } from '../middleware/requireCapability.js'
import { getCurrentMembers, getPastMembers, getUnits } from './controllers/managers/unit-members.js'


const router = Router()



/**
 * Endpoints
 */


// GET Unit Information

router.get('/units',
    getUnits
)

router.get('/:userID/units/:unitID',
    requireAuth,
    requireCapability('units', 'units', 'unitID'),
    async (req, res) => {
        const { unitID } = req.params
        try {
            const [rows] = await pool.query('SELECT * FROM units WHERE id = ? LIMIT 1', [unitID])
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Unit not found.' })
            }
            res.json(rows[0])
        } catch (err) {
            console.error('Fetch unit info error:', err)
            res.status(500).json({ message: 'Something went wrong - Unit Info' })
        }
    }
)

// GET Current Members List
router.get('/:userID/units/:unitID/members',
    requireAuth, requireCapability('units', 'units', 'unitID'), getCurrentMembers)

// GET Past Members List
router.get('/:userID/units/:unitID/past-members',
    requireAuth, requireCapability('units', 'units', 'unitID'), getPastMembers)

export default router