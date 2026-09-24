import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRouter from './routes/auth.js'

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN, // e.g. 'http://localhost:3000'
    credentials: true, // required for cookies to be accepted cross-origin
}))

app.use(express.json())
app.use(cookieParser())

app.get('/health', (req, res) => { res.json({ status: 'ok' }) })

app.use('/api/auth', authRouter)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})