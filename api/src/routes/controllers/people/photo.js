import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { pool } from '../../../db.js'
import { notifyExternalApi } from '../../../utils/externalNotifier.js'


const UPLOAD_ROOT = process.env.UPLOAD_ROOT ?? path.resolve('uploads')

export async function getPhoto(req, res) {
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

export async function changePhoto(req, res) {
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