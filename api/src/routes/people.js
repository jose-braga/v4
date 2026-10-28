import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireCapability } from '../middleware/requireCapability.js'
import { getCoreInformation, updateCoreInformation } from './controllers/people/core-information.js'
import { getVisibility, updateVisibility } from './controllers/people/data-visibility.js'
import { getPhoto, changePhoto } from './controllers/people/photo.js'
import { getAcademicAffiliations, updateAcademicAffiliations,
    getWorkplaces, updateWorkplaces
 } from './controllers/people/academic-affiliations.js'
import { getAcademicDegrees, updateAcademicDegrees } from './controllers/people/academic-degrees.js'
import { getJobs, updateJobs } from './controllers/people/jobs.js'
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

/**
 * Academic affiliations endpoints
 */
router.get('/:personId/academic-affiliations',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getAcademicAffiliations)

router.put('/:personId/academic-affiliations',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'), updateAcademicAffiliations)

router.get('/:personId/workplaces',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getWorkplaces)

router.put('/:personId/workplaces',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'), updateWorkplaces)

/**
 * Academic degrees endpoints
 */
router.get('/:personId/academic-degrees',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getAcademicDegrees)

router.put('/:personId/academic-degrees',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'), updateAcademicDegrees)

/**
 * Professional situation endpoints
 */
router.get('/:personId/jobs',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getJobs)

router.put('/:personId/jobs',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'), updateJobs)




export default router

