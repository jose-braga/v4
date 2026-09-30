// routes/lookups.js
import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

// Whitelist: URL segment -> query. Table names never come from user input.
// Convention: every query returns at least `id` and `name`.
const lookups = {
    countries: 'SELECT id, name FROM countries ORDER BY name',
}

router.get('/:name', async (req, res) => {
    const { name } = req.params

    // Object.hasOwn, not `lookups[name]`: a request for /constructor or
    // /__proto__ would otherwise find inherited properties on the object.
    if (!Object.hasOwn(lookups, name)) {
        return res.status(404).json({ message: 'Unknown lookup.' })
    }

    try {
        const [rows] = await pool.query(lookups[name])
        res.set('Cache-Control', 'public, max-age=3600') // reference data changes rarely
        res.json(rows)
    } catch (err) {
        console.error(`Lookup ${name} error:`, err)
        res.status(500).json({ message: 'Something went wrong.' })
    }
})

export default router