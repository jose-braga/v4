import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireCapability } from '../middleware/requireCapability.js'
import { getCoreInformation, updateCoreInformation } from './controllers/people/core-information.js'
import { getVisibility, updateVisibility } from './controllers/people/data-visibility.js'
import { getPhoto, changePhoto } from './controllers/people/photo.js'
import { getShortCv, updateShortCv } from './controllers/people/short-cv.js'
import { getPersonalContacts, updatePersonalContacts } from './controllers/people/personal-contacts.js'
import { getPersonalUrls, updatePersonalUrls } from './controllers/people/personal-urls.js'
import { getEmergencyContacts, updateEmergencyContacts } from './controllers/people/emergency-contacts.js'
import { getOtherEditors, updateOtherEditors } from './controllers/people/other-editors.js'

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
    upload.single('photo'), changePhoto)

/**
 * Person Short CV endpoints
 */
router.get('/:personId/short-cv',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getShortCv)

router.put('/:personId/short-cv',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'), updateShortCv)

/**
 * Person Personal URLs
 */
router.get('/:personId/personal-urls',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getPersonalUrls)

router.put('/:personId/personal-urls',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'), updatePersonalUrls)

/**
 * Person Personal Contacts
 */
router.get('/:personId/personal-contacts',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getPersonalContacts)

router.put('/:personId/personal-contacts',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'), updatePersonalContacts)

/**
 * Person Emergency contacts
 */
router.get('/:personId/emergency-contacts',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getEmergencyContacts)

router.put('/:personId/emergency-contacts',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'), updateEmergencyContacts)

/**
 * Person other editors (assuming managers can edit this list)
 */
router.get('/:personId/other-editors',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getOtherEditors)

router.put('/:personId/other-editors',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'), updateOtherEditors)


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

