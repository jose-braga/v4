import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireCapability } from '../middleware/requireCapability.js'
import { getCoreInformation, updateCoreInformation } from './controllers/people/core-information.js'
import { getVisibility, updateVisibility } from './controllers/people/data-visibility.js'
import { getPhoto, changePhoto } from './controllers/people/photo.js'
import multer from 'multer'

const router = Router()

/**
 * Core information endpoints
 */
router.get('/:personId/core-information',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getCoreInformation)

router.put('/:personId/core-information',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'), updateCoreInformation)

/**
 * Data visibility endpoints
 */

router.get('/:personId/data-visibility',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'), getVisibility)

router.put('/:personId/data-visibility',
    requireAuth, updateVisibility)

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

router.get('/:personId/photo',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'), getPhoto)

router.post('/:personId/photo',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),
    upload.single('photo'), changePhoto
)

export default router