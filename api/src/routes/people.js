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
import { getPoles, updatePoles,
    getPersonLabs, updatePersonLabs, updatePersonOffices
 } from './controllers/people/institutional-affiliations.js'
import { getResponsibles, updateResponsibles } from './controllers/people/responsibles.js'
import { getResearcherInfo, updateResearcherInfo } from './controllers/people/researcher-info.js'
import { getContacts, updateContacts } from './controllers/people/institutional-contacts.js'
import { getJobs, updateJobs } from './controllers/people/jobs.js'
import { getResearchInterests, updateResearchInterests } from './controllers/people/research-interests.js'
import { getAuthorNames, updateAuthorNames } from './controllers/people/publications.js'
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


/**
 * Institutional affiliations endpoints
 */
router.get('/:personId/poles',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getPoles)
// a person cannot edit their own poles, only managers can do that, so allowSelf is false
router.put('/:personId/poles',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),
    updatePoles)

router.get('/:personId/institutional-affiliations',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getPersonLabs)

// a person cannot edit their own labs, only managers can do that, so allowSelf is false
router.put('/:personId/institutional-affiliations/labs',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId', {allowSelf: false}),
    updatePersonLabs)

router.put('/:personId/institutional-affiliations/offices',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId', {allowSelf: false}),
    updatePersonOffices)

/**
 * Institutional supervisor/responsible endpoints
 */

router.get('/:personId/supervisors',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getResponsibles)
// a person cannot edit their own poles, only managers can do that, so allowSelf is false
router.put('/:personId/supervisors',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),
    updateResponsibles)

/**
 * Institutional researcher info endpoints
 */

router.get('/:personId/researcher-info',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getResearcherInfo)
// a person cannot edit their own poles, only managers can do that, so allowSelf is false
router.put('/:personId/researcher-info',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),
    updateResearcherInfo)

/**
 * Institutional contacts endpoints
 */

router.get('/:personId/contacts',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getContacts)
// a person cannot edit their own poles, only managers can do that, so allowSelf is false
router.put('/:personId/contacts',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),
    updateContacts)


/**
 * Institutional research interests endpoints
 */
router.get('/:personId/research-interests',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getResearchInterests)
// a person cannot edit their own research interests, only managers can do that, so allowSelf is false
router.put('/:personId/research-interests',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),
    updateResearchInterests)

/**
 * Institutional research interests endpoints
 */
router.get('/:personId/author-names',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),  getAuthorNames)
// a person cannot edit their own research interests, only managers can do that, so allowSelf is false
router.put('/:personId/author-names',
    requireAuth, requireCapability('edit_people_data', 'people', 'personId'),
    updateAuthorNames)




export default router

