import { pool } from '../../../db.js'
import { notifyExternalApi } from '../../../utils/externalNotifier.js'

export async function getVisibility(req, res) {
    const { personId } = req.params
    try {
        const [rows] = await pool.query(
            'SELECT visible_public FROM people WHERE id = ? LIMIT 1',
            [personId]
        )
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Person not found.' })
        }
        res.json({ visibility: Boolean(rows[0].visible_public) })
    } catch (err) {
        console.error('Fetch data visibility error:', err)
        res.status(500).json({ message: 'Something went wrong.' })
    }
}

export async function updateVisibility(req, res) {
    const { personId } = req.params
    const { visibility } = req.body

    // Consent can only be given or withdrawn by the person themselves.
    if (String(personId) !== String(req.user.personId)) {
        return res.status(403).json({ message: 'Only the person themselves can change this setting.' })
    }

    if (typeof visibility !== 'boolean') {
        return res.status(400).json({ message: 'Visibility must be true or false.' })
    }

    try {
        await pool.query(
            'UPDATE people SET visible_public = ? WHERE id = ?',
            [visibility ? 1 : 0, personId]
        )
        res.json({ visibility })
        if (visibility) {
            notifyExternalApi('create', 'people', personId)
        } else {
            notifyExternalApi('delete', 'people', personId)
        }
    } catch (err) {
        console.error('Update data visibility error:', err)
        res.status(500).json({ message: 'Something went wrong.' })
    }
}
