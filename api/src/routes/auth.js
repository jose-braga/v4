import crypto from 'crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { sendPasswordResetEmail } from '../emailer.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 1 week
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

router.post('/login', async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' })
    }

    try {
        const [rows] = await pool.query(
            'SELECT users.id, users.username, users.password,'
            + ' people.id AS person_id, personal_photo.url AS photo_url'
            + ' FROM users'
            + ' LEFT JOIN people ON people.user_id = users.id'
            + ' LEFT JOIN personal_photo ON personal_photo.person_id = people.id'
            + ' WHERE users.username = ?'
            + ' LIMIT 1',
            [username]
        )

        // Deliberately generic error, and constant-shape response, whether the
        // username doesn't exist OR the password is wrong — don't reveal which.
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password.' })
        }

        const user = rows[0]
        const passwordMatches = await bcrypt.compare(password, user.password)

        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid username or password.' })
        }

        const token = jwt.sign(
            { sub: user.id, username: user.username, person_id: user.person_id },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // see note below
            sameSite: 'lax',
            maxAge: TOKEN_MAX_AGE_MS,
            path: '/',
        })

        return res.json({
                id: user.id,
                username: user.username,
                person_id: user.person_id,
                photo_url: user.photo_url
            })
    } catch (err) {
        console.error('Login error:', err)
        return res.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
})

router.get('/me', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT users.id, users.username, users.password,'
            + ' people.id AS person_id, personal_photo.url AS photo_url'
            + ' FROM users'
            + ' LEFT JOIN people ON people.user_id = users.id'
            + ' LEFT JOIN personal_photo ON personal_photo.person_id = people.id'
            + ' WHERE users.id = ?'
            + ' LIMIT 1',
            [req.user.id]
        )
        if (rows.length === 0) {
            return res.status(401).json({ message: 'User no longer exists.' })
        }

        const user = rows[0]

        res.json({
            id: user.id,
            username: user.username,
            person_id: user.person_id,
            photo_url: user.photo_url ?? null,
        })
    } catch (err) {
        console.error('Error fetching user info:', err)
        return res.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
})

router.post('/change-password', async (req, res) => {
    const { username, oldPassword, newPassword, confirmPassword } = req.body

    if (!username || !oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required.' })
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'New passwords do not match.' })
    }

    try {
        const [rows] = await pool.query(
            'SELECT users.id, users.username, users.password,'
            + ' people.id AS person_id, personal_photo.url AS photo_url'
            + ' FROM users'
            + ' LEFT JOIN people ON people.user_id = users.id'
            + ' LEFT JOIN personal_photo ON personal_photo.person_id = people.id'
            + ' WHERE users.username = ?'
            + ' LIMIT 1',
            [username]
        )

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Invalid username or password.' })
        }

        const user = rows[0]
        const passwordMatches = await bcrypt.compare(oldPassword, user.password)

        if (!passwordMatches) {
            return res.status(400).json({ message: 'Invalid username or password.' })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id])

         const token = jwt.sign(
            { sub: user.id, username: user.username, person_id: user.person_id },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // see note below
            sameSite: 'lax',
            maxAge: TOKEN_MAX_AGE_MS,
            path: '/',
        })

        return res.json({
                id: user.id,
                username: user.username,
                person_id: user.person_id,
                photo_url: user.photo_url
            })
    } catch (err) {
        console.error('Error changing password:', err)
        return res.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
})

router.post('/request-password-reset', async (req, res) => {
    const { emailOrUsername } = req.body

    if (!emailOrUsername) {
        return res.status(400).json({ message: 'Email or username is required.' })
    }

    // Always respond the same way, whether or not the account exists —
    // do NOT let this endpoint reveal which accounts are real.
    const genericResponse = {
        message: 'If that account exists, we\'ve sent instructions to reset the password.',
    }

    try {
        const [rows] = await pool.query(
            'SELECT users.id, users.username, '
            + ' people.id AS person_id, emails.email,'
            + ' personal_emails.email AS personal_email'
            + ' FROM users'
            + ' LEFT JOIN people ON people.user_id = users.id'
            + ' LEFT JOIN emails ON emails.person_id = people.id'
            + ' LEFT JOIN personal_emails ON personal_emails.person_id = people.id'
            + ' WHERE users.username = ?  OR emails.email = ? OR personal_emails.email = ?'
            + ' LIMIT 1;',
            [emailOrUsername, emailOrUsername, emailOrUsername]
        )


        if (rows.length === 0) {
            return res.json(genericResponse) // same response either way
        }

        const user = rows[0]
        const emails = [user.email, user.personal_email].filter(Boolean).join(', ');
        if (emails === '') {
            console.warn(`Password reset requested for user ${user.id}, but no email is on file.`)
            return res.json(genericResponse)
        }

        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
        const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

        await pool.query(
            'UPDATE users SET password_recovery = ?, recovery_expires = ? WHERE id = ?',
            [tokenHash, expiresAt, user.id]
        )

        const resetUrl = `${process.env.FRONTEND_ORIGIN}/reset-password?token=${rawToken}`

        await sendPasswordResetEmail(emails, resetUrl)

        return res.json(genericResponse)
    } catch (err) {
        console.error('Password reset request error:', err)
        return res.json(genericResponse)
    }
})

router.post('/reset-password', async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body

    if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required.' })
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' })
    }

    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
        console.log('Token hash:', tokenHash) // Debugging line
        const [rows] = await pool.query(
            `SELECT id FROM users
             WHERE password_recovery = ? AND recovery_expires > UTC_TIMESTAMP()
             LIMIT 1`,
            [tokenHash]
        )

        if (rows.length === 0) {
            return res.status(400).json({ message: 'This reset link is invalid or has expired.' })
        }

        const user = rows[0]
        const newHash = await bcrypt.hash(newPassword, 10)

        await pool.query(
            'UPDATE users SET password = ?, password_recovery = NULL, recovery_expires = NULL WHERE id = ?',
            [newHash, user.id]
        )

        return res.json({ message: 'Password has been reset. You can now log in.' })
    } catch (err) {
        console.error('Password reset error:', err)
        return res.status(500).json({ message: 'Something went wrong. Please try again.' })
    }
})

router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    })
    res.json({ message: 'Logged out.' })
})

export default router