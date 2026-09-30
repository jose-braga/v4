import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRouter from './routes/auth.js'
import lookupsRouter from './routes/lookups.js'
import peopleRouter from './routes/people.js'
import morgan from 'morgan'

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN, // e.g. 'http://localhost:3000'
    credentials: true, // required for cookies to be accepted cross-origin
}))

app.use(express.json())
app.use(cookieParser())
app.use(morgan(':date[iso] - :method :url :status :response-time ms - :res[content-length]'))

app.get('/health', (req, res) => { res.json({ status: 'ok' }) })

// Authentication and authorization routes
app.use('/api/auth', authRouter)

// People, labs, units, management routes
app.use('/api/people', peopleRouter)

// Lookup routes
app.use('/api/lookups', lookupsRouter)

// static file serving for uploaded files (e.g., personal photos)
app.use('/uploads', express.static(process.env.UPLOAD_ROOT ?? path.resolve('uploads')))

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})