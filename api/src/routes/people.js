import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireCapability } from '../middleware/requireCapability.js'
import { notifyExternalApi } from '../utils/externalNotifier.js'
import multer from 'multer'
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

const router = Router()

async function getNationalities(personId) {
    const [rows] = await pool.query(
        `SELECT country_id
        FROM people_countries
        WHERE person_id = ?;
        `,
        [personId]
    )
    return rows.map((r) => r.country_id)
}

/**
 * Core information endpoints
 */
router.get('/:personId/core-information',
    requireAuth,
    requireCapability('person', 'people', 'personId'),
    async (req, res) => {
        const { personId } = req.params
        try {
            const [rows] = await pool.query(
                `SELECT name, colloquial_name, gender, birth_date
                FROM people WHERE id = ?
                LIMIT 1`,
                [personId]
            )
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Person not found.' })
            }

            rows[0].nationalities = await getNationalities(personId)
            res.json(rows[0])
            notifyExternalApi('update', 'people', personId)
        } catch (err) {
            console.error('Fetch core information error:', err)
            res.status(500).json({ message: 'Something went wrong - Core Information' })
        }
    }
)

router.put('/:personId/core-information',
    requireAuth,
    requireCapability('person', 'people', 'personId'),
    async (req, res) => {
        const { personId } = req.params
        const { name, colloquial_name, gender, birth_date, nationalities= [] } = req.body

        const conn = await pool.getConnection()

        try {
            await conn.beginTransaction()

            // 1. Update core fields on people table
            await conn.query(
                `UPDATE people
                 SET name = ?, colloquial_name = ?, gender = ?, birth_date = ?
                 WHERE id = ?`,
                [name, colloquial_name, gender, birth_date || null, personId]
            )

            // 2. Sync nationalities in people_countries table
            await conn.query(`DELETE FROM people_countries WHERE person_id = ?`, [personId])

            if (nationalities.length > 0) {
                const values = nationalities.map((countryId) => [personId, countryId])
                await conn.query(
                    `INSERT INTO people_countries (person_id, country_id) VALUES ?`,
                    [values]
                )
            }

            await conn.commit()

            // 3. Return updated object matching CoreInformationPayload interface
            const [rows] = await pool.query(
                `SELECT name, colloquial_name, gender, birth_date
                 FROM people WHERE id = ? LIMIT 1`,
                [personId]
            )

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Person not found.' })
            }

            rows[0].nationalities = await getNationalities(personId)
            res.json(rows[0])
        } catch (err) {
            await conn.rollback()
            console.error('Update core information error:', err)
            res.status(500).json({ message: 'Something went wrong.' })
        } finally {
            conn.release()
        }
    }
)

/**
 * Data visibility endpoints
 */

router.get('/:personId/data-visibility',
    requireAuth,
    requireCapability('person', 'people', 'personId'),
    async (req, res) => {
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
)

router.put('/:personId/data-visibility', requireAuth, async (req, res) => {
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
})

/**
 * Person photo endpoints
 */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
    fileFilter: (req, file, cb) => {
        cb(null, file.mimetype.startsWith('image/'))
    },
})

const UPLOAD_ROOT = process.env.UPLOAD_ROOT ?? path.resolve('uploads')

router.get(
    '/:personId/photo',
    requireAuth,
    requireCapability('person', 'people', 'personId'),
    async (req, res) => {
        const { personId } = req.params
        try {
            const [rows] = await pool.query(
                'SELECT photo_type_id, url FROM personal_photo WHERE person_id = ?',
                [personId]
            )
            const photo196Url = rows.find((r) => r.photo_type_id === 1)?.url ?? null
            const photo600Url = rows.find((r) => r.photo_type_id === 2)?.url ?? null
            res.json({ photo196Url, photo600Url })
        } catch (err) {
            console.error('Fetch photo error:', err)
            res.status(500).json({ message: 'Something went wrong.' })
        }
    }
)

router.post(
    '/:personId/photo',
    requireAuth,
    requireCapability('person', 'people', 'personId'),
    upload.single('photo'),
    async (req, res) => {
        const { personId } = req.params
        if (!req.file) {
            return res.status(400).json({ message: 'No image was uploaded.' })
        }

        try {
            const cacheBust = Date.now()
            const sizes = [
                { typeId: 1, size: 196 },
                { typeId: 2, size: 600 },
            ]

            for (const { typeId, size } of sizes) {
                const dir = path.join(UPLOAD_ROOT, 'people', String(personId), String(typeId))
                await fs.mkdir(dir, { recursive: true })
                await sharp(req.file.buffer)
                    .resize(size, size, { fit: 'cover' })
                    .jpeg({ quality: 90 })
                    .toFile(path.join(dir, 'photo.jpg'))
            }

            const baseUrl = `${process.env.API_PUBLIC_ORIGIN}/uploads/people/${personId}`
            const photo196Url = `${baseUrl}/1/photo.jpg?v=${cacheBust}`
            const photo600Url = `${baseUrl}/2/photo.jpg?v=${cacheBust}`

            await pool.query(
                `INSERT INTO personal_photo (person_id, photo_type_id, url)
                 VALUES (?, 1, ?), (?, 2, ?)
                 ON DUPLICATE KEY UPDATE url = VALUES(url)`,
                [personId, photo196Url, personId, photo600Url]
            )

            res.json({ photo196Url, photo600Url })
            notifyExternalApi('update', 'people', personId)
        } catch (err) {
            console.error('Upload photo error:', err)
            res.status(500).json({ message: 'Something went wrong while saving the photo.' })
        }
    }
)

export default router