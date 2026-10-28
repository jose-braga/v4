import { pool } from '../db.js'
import { getPersonHierarchy } from './hierarchy.js'

const UCIBIO_UNIT_ID = 1;
const LISBON_CITY_ID = 1;

async function inLisbonPole(personId) {
    const [rows] = await pool.query(
        `SELECT 1
           FROM people_institution_city
          WHERE person_id = ?
            AND city_id = ?
            AND (valid_from  IS NULL OR valid_from  <= CURDATE())
            AND (valid_until IS NULL OR valid_until >= CURDATE())
          LIMIT 1`,
        [personId, LISBON_CITY_ID],
    );
    return rows.length > 0;
}

async function isUcibioMember(personId) {
    const chain = await getPersonHierarchy(personId);     // person → … → unit
    return chain.some((n) => n.resourceType === 'units' && n.resourceId === UCIBIO_UNIT_ID)
}

export async function getFeatures(personId) {
    const [ucibio, lisbon] = await Promise.all([isUcibioMember(personId), inLisbonPole(personId)])
    const features = []
    if (lisbon) features.push('spaces')                  // any Lisbon-pole member, any unit
    if (lisbon && ucibio) features.push('warehouse')     // Lisbon pole and UCIBIO
    return features
}

//module.exports = { getFeatures };