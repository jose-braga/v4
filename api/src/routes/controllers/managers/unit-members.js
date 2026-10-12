import { pool } from '../../../db.js'
import { toIsoDateString } from '../../../utils/time.js'
/**
 * Helper to fetch all nested/sub-table details for a list of person IDs in parallel bulk queries.
 */
async function fetchMembersDetails(personIds, unitID, moreDetails = false) {
    if (personIds.length === 0) return []

    // 1. Fire off all parallel batch queries using IN (?)
    const bulkQueries = [
        pool.query(`SELECT * FROM researchers_info WHERE person_id IN (?)`, [personIds]),
        pool.query(
            `SELECT pl.*,
                    l.name AS lab_name, l.short_name AS lab_short_name,
                    l.started AS lab_started, l.finished AS lab_finished,
                    g.id AS group_id, g.name AS group_name, g.short_name AS group_short_name,
                    lp.name_en AS lab_position_name_en, lp.name_pt AS lab_position_name_pt,
                    lp.sort_order
            FROM people_labs pl
            JOIN labs l ON l.id = pl.lab_id
            JOIN \`groups\` g ON g.id = (
                SELECT lg.group_id
                FROM labs_groups lg
                WHERE lg.lab_id = l.id
                AND (lg.valid_from IS NULL
                        OR lg.valid_from <= LEAST(COALESCE(pl.valid_until, CURDATE()), CURDATE()))
                AND (lg.valid_until IS NULL
                        OR lg.valid_until >= LEAST(COALESCE(pl.valid_until, CURDATE()), CURDATE()))
                ORDER BY lg.valid_from DESC
                LIMIT 1
            )
            JOIN groups_units gu ON gu.group_id = g.id AND gu.unit_id = ?
            LEFT JOIN lab_positions lp ON lp.id = pl.lab_position_id
            WHERE pl.person_id IN (?)`,
            [unitID, personIds]
        ),
        pool.query(
            `SELECT t.*,
                    toff.name_en AS technician_office_name_en,
                    toff.started AS technician_office_started, toff.finished AS technician_office_finished,
                    tp.name_en AS technician_position_name_en, tp.name_pt AS technician_position_name_pt,
                    tp.sort_order
            FROM technicians t
            JOIN technician_offices toff ON toff.id = t.technician_office_id
            JOIN technicians_units tu ON tu.technician_id = t.id AND tu.unit_id = ?
            LEFT JOIN technician_positions tp ON tp.id = t.technician_position_id
            WHERE t.person_id IN (?)`,
            [unitID, personIds]
        ),
        pool.query(
            `SELECT sm.*,
                    smo.name_en AS science_manager_office_name_en,
                    smo.started AS science_manager_office_started, smo.finished AS science_manager_office_finished,
                    smp.name_en AS science_manager_position_name_en, smp.name_pt AS science_manager_position_name_pt,
                    smp.sort_order
            FROM science_managers sm
            JOIN science_manager_offices smo ON smo.id = sm.science_manager_office_id
            JOIN science_managers_units smu ON smu.science_manager_id = sm.id AND smu.unit_id = ?
            LEFT JOIN science_manager_positions smp ON smp.id = sm.science_manager_position_id
            WHERE sm.person_id IN (?)`,
            [unitID, personIds]
        ),
        pool.query(
            `SELECT pao.*,
                    ao.name_en AS administrative_office_name_en,
                    ao.started AS administrative_office_started, ao.finished AS administrative_office_finished,
                    ap.name_en AS administrative_position_name_en, ap.name_pt AS administrative_position_name_pt,
                    ap.sort_order
            FROM people_administrative_offices pao
            JOIN administrative_offices ao ON ao.id = pao.administrative_office_id
            JOIN people_administrative_units pau ON pau.administrative_id = pao.id AND pau.unit_id = ?
            LEFT JOIN administrative_positions ap ON ap.id = pao.administrative_position_id
            WHERE pao.person_id IN (?)`,
            [unitID, personIds]
        ),
        pool.query(`SELECT * FROM emails WHERE person_id IN (?)`, [personIds]),
        pool.query(`SELECT * FROM personal_emails WHERE person_id IN (?)`, [personIds]),
    ]

    if (moreDetails) {
        bulkQueries.push(
                pool.query(
                `SELECT pic.*, ic.city
                FROM people_institution_city pic
                LEFT JOIN institution_city ic ON ic.id = pic.city_id
                WHERE pic.person_id IN (?)`,
                [personIds]
            ),
            pool.query(
                `SELECT pcc.*, cc.name, cc.short_name
                FROM people_cost_centers pcc
                JOIN cost_centers cc ON cc.id = pcc.cost_center_id
                WHERE pcc.person_id IN (?)`,
                [personIds]
            ),
            pool.query(
                `SELECT dp.*, d.name_en
                 FROM degrees_people dp
                 JOIN degrees d ON d.id = dp.degree_id
                 WHERE dp.person_id IN (?)`,
                [personIds]
            ),
            pool.query(
                `SELECT pd.id AS people_departments_id, pd.department_id, d.name_en AS department,
                        pd.valid_from AS department_start, pd.valid_until AS department_end,
                        s.shortname_en AS school_shortname_en, u.shortname_en AS university_shortname_en
                 FROM people_departments pd
                 LEFT JOIN departments d ON pd.department_id = d.id
                 LEFT JOIN schools s ON s.id = d.school_id
                 LEFT JOIN universities u ON u.id = s.university_id
                 WHERE pd.person_id IN (?)`,
                [personIds]
            ),
            pool.query(
                `SELECT j.*, cs.category_id, cs.situation_id,
                        c.name_en AS category_name_en,
                        s.name_en AS situation_name_en,
                        s.requires_unit_contract, s.requires_fellowship
                 FROM jobs j
                 LEFT JOIN categories_situations cs ON cs.id = j.category_situation_id
                 LEFT JOIN categories c ON c.id = cs.category_id
                 LEFT JOIN situations s ON s.id = cs.situation_id
                 WHERE j.person_id IN (?)`,
                [personIds]
            )
        )
    }

    const results = await Promise.all(bulkQueries)

    const [researchersInfo] = results[0]
    const [history] = results[1]
    const [techData] = results[2]
    const [smData] = results[3]
    const [adminData] = results[4]
    const [emails] = results[5]
    const [personalEmails] = results[6]

    const poles = moreDetails ? results[7][0] : []
    const costCenters = moreDetails ? results[8][0] : []
    const degrees = moreDetails ? results[9][0] : []
    const departments = moreDetails ? results[10][0] : []
    const jobs = moreDetails ? results[11][0] : []

    // 2. Fetch job sub-details (Fellowships & Contracts) if present
    const jobIds = jobs.map((j) => j.id)
    let fellowships = []
    let contracts = []

    if (moreDetails && jobIds.length > 0) {
        const [fellowshipRows] = await pool.query(
            `SELECT jf.job_id, jf.fellowship_id,
                    f.fellowship_type_id, ft.name AS fellowship_name, ft.acronym AS fellowship_acronym,
                    f.reference, f.start, f.end, f.maximum_extension,
                    ffa.id AS fellowships_funding_agencies_id, ffa.funding_agency_id,
                    fa.official_name AS funding_agency_official_name, fa.short_name AS funding_agency_short_name,
                    fme.id AS fellowships_management_entities_id, fme.management_entity_id,
                    me.official_name AS management_entity_official_name, me.short_name AS management_entity_short_name
             FROM jobs_fellowships jf
             JOIN fellowships f ON f.id = jf.fellowship_id
             LEFT JOIN fellowship_types ft ON ft.id = f.fellowship_type_id
             LEFT JOIN fellowships_management_entities fme ON f.id = fme.fellowship_id
             LEFT JOIN management_entities me ON fme.management_entity_id = me.id
             LEFT JOIN fellowships_funding_agencies ffa ON f.id = ffa.fellowship_id
             LEFT JOIN funding_agencies fa ON ffa.funding_agency_id = fa.id
             WHERE jf.job_id IN (?)`,
            [jobIds]
        )
        fellowships = fellowshipRows

        const [contractRows] = await pool.query(
            `SELECT jc.job_id, jc.contract_id, c.reference, c.start, c.end, c.maximum_extension
             FROM jobs_contracts jc
             JOIN contracts c ON c.id = jc.contract_id
             WHERE jc.job_id IN (?)`,
            [jobIds]
        )
        contracts = contractRows
    }

    // Assign fellowships/contracts to jobs
    if (moreDetails && jobs.length > 0) {
        const jobsMap = new Map(jobs.map((j) => [j.id, { ...j, fellowships: [], contracts: [] }]))
        fellowships.forEach((f) => jobsMap.get(f.job_id)?.fellowships.push(f))
        contracts.forEach((c) => jobsMap.get(c.job_id)?.contracts.push(c))

        // Re-assign back to jobs list
        jobs.length = 0
        jobs.push(...Array.from(jobsMap.values()))
    }

    // 3. Assemble and return structured map
    const map = new Map()
    personIds.forEach((id) => {
        map.set(id, {
            researcher_details: [],
            history: [],
            technician_data: [],
            science_manager_data: [],
            administrative_data: [],
            email: [],
            personal_email: [],

            ...(moreDetails && { pole: [], cost_center: [], degrees: [],
                departments: [], jobs: [] })
        })
    })

    researchersInfo.forEach((r) => map.get(r.person_id)?.researcher_details.push(r))
    history.forEach((h) => map.get(h.person_id)?.history.push(h))
    techData.forEach((t) => map.get(t.person_id)?.technician_data.push(t))
    smData.forEach((sm) => map.get(sm.person_id)?.science_manager_data.push(sm))
    adminData.forEach((a) => map.get(a.person_id)?.administrative_data.push(a))
    emails.forEach((e) => map.get(e.person_id)?.email.push(e))
    personalEmails.forEach((pe) => map.get(pe.person_id)?.personal_email.push(pe))


    if (moreDetails) {
        poles.forEach((po) => map.get(po.person_id)?.pole.push(po))
        costCenters.forEach((cc) => map.get(cc.person_id)?.cost_center.push(cc))
        degrees.forEach((d) => map.get(d.person_id)?.degrees.push(d))
        departments.forEach((d) => map.get(d.person_id)?.departments.push(d))
        jobs.forEach((j) => map.get(j.person_id)?.jobs.push(j))
    }

    return map
}

/**
 * Build dynamic filters for query string parameters (q, lab, group)
 */
function buildQueryFilters(reqQuery) {
    let qArray = []
    let likeNameExpression = ''
    const hasSearch = reqQuery.q !== undefined

    if (hasSearch) {
        let qSplit = reqQuery.q.split(' ')
        likeNameExpression = ' AND ((people.name LIKE ?'
        qArray.push(`%${qSplit[0]}%`)

        for (let i = 1; i < qSplit.length; i++) {
            likeNameExpression += ' AND people.name LIKE ?'
            qArray.push(`%${qSplit[i]}%`)
        }
        likeNameExpression += ') OR emails.email LIKE ? OR personal_emails.email LIKE ? OR researchers_info.ciencia_id LIKE ? OR BINARY people.id = ?) '
        qArray.push(reqQuery.q, reqQuery.q, reqQuery.q, reqQuery.q)
    }

    let labFilter = ''
    let labParams = []
    if (reqQuery.lab !== undefined) {
        let labraw = reqQuery.lab
        let lab = '%' + labraw.replace(/\s/gi, '%') + '%'
        labFilter = ' AND (labs.name LIKE ? OR labs.short_name = ? OR BINARY labs.id = ?) '
        labParams = [lab, labraw, labraw]
    }

    let groupFilter = ''
    let groupParams = []
    if (reqQuery.group !== undefined) {
        let groupraw = reqQuery.group
        let group = '%' + groupraw.replace(/\s/gi, '%') + '%'
        groupFilter = ' AND (`groups`.name LIKE ? OR `groups`.short_name = ?) '
        groupParams = [group, groupraw]
    }

    const joinSearchTables = hasSearch
        ? ' LEFT JOIN emails ON emails.person_id = people.id LEFT JOIN personal_emails ON personal_emails.person_id = people.id LEFT JOIN researchers_info ON researchers_info.person_id = people.id '
        : ' '

    return { qArray, likeNameExpression, labFilter, labParams, groupFilter, groupParams, joinSearchTables }
}

export async function getCurrentMembers(req, res) {
    const { unitID } = req.params
    const today = toIsoDateString(new Date())
    const moreDetails = req.query.details === '1'

    const {
        qArray, likeNameExpression, labFilter, labParams,
        groupFilter, groupParams, joinSearchTables
    } = buildQueryFilters(req.query)

    const dateFilter = ` AND ((people_labs.valid_from IS NULL AND people_labs.valid_until IS NULL)
                            OR (people_labs.valid_from <= ? AND people_labs.valid_until IS NULL)
                            OR (people_labs.valid_from IS NULL AND people_labs.valid_until >= ?)
                            OR (people_labs.valid_from <= ? AND people_labs.valid_until >= ?)) `

    const querySQL = `
        SELECT DISTINCT people.id AS person_id, people.user_id, people.name, people.colloquial_name
        FROM people
        JOIN people_labs ON people_labs.person_id = people.id
        JOIN labs ON labs.id = people_labs.lab_id
        JOIN labs_groups ON labs_groups.lab_id = labs.id
            AND (labs_groups.valid_from IS NULL OR labs_groups.valid_from <= ?)
            AND (labs_groups.valid_until IS NULL OR labs_groups.valid_until >= ?)
        JOIN \`groups\` ON \`groups\`.id = labs_groups.group_id
        JOIN groups_units ON groups_units.group_id = \`groups\`.id
        ${joinSearchTables}
        WHERE people.status = 1 AND groups_units.unit_id = ? ${likeNameExpression} ${labFilter} ${groupFilter} ${dateFilter}

        UNION

        SELECT DISTINCT people.id AS person_id, people.user_id, people.name, people.colloquial_name
        FROM people
        JOIN technicians ON technicians.person_id = people.id
        JOIN technician_offices ON technician_offices.id = technicians.technician_office_id
        JOIN technicians_units ON technicians_units.technician_id = technicians.id
        ${joinSearchTables}
        WHERE people.status = 1 AND technicians_units.unit_id = ? ${likeNameExpression}
        AND ((technicians.valid_from IS NULL AND technicians.valid_until IS NULL)
            OR (technicians.valid_from <= ? AND technicians.valid_until IS NULL)
            OR (technicians.valid_from IS NULL AND technicians.valid_until >= ?)
            OR (technicians.valid_from <= ? AND technicians.valid_until >= ?))

        UNION

        SELECT DISTINCT people.id AS person_id, people.user_id, people.name, people.colloquial_name
        FROM people
        JOIN science_managers ON science_managers.person_id = people.id
        JOIN science_manager_offices ON science_manager_offices.id = science_managers.science_manager_office_id
        JOIN science_managers_units ON science_managers_units.science_manager_id = science_managers.id
        ${joinSearchTables}
        WHERE people.status = 1 AND science_managers_units.unit_id = ? ${likeNameExpression}
        AND ((science_managers.valid_from IS NULL AND science_managers.valid_until IS NULL)
            OR (science_managers.valid_from <= ? AND science_managers.valid_until IS NULL)
            OR (science_managers.valid_from IS NULL AND science_managers.valid_until >= ?)
            OR (science_managers.valid_from <= ? AND science_managers.valid_until >= ?))

        UNION

        SELECT DISTINCT people.id AS person_id, people.user_id, people.name, people.colloquial_name
        FROM people
        JOIN people_administrative_offices ON people_administrative_offices.person_id = people.id
        JOIN administrative_offices ON administrative_offices.id = people_administrative_offices.administrative_office_id
        JOIN people_administrative_units ON people_administrative_units.administrative_id = people_administrative_offices.id
        ${joinSearchTables}
        WHERE people.status = 1 AND people_administrative_units.unit_id = ? ${likeNameExpression}
        AND ((people_administrative_offices.valid_from IS NULL AND people_administrative_offices.valid_until IS NULL)
            OR (people_administrative_offices.valid_from <= ? AND people_administrative_offices.valid_until IS NULL)
            OR (people_administrative_offices.valid_from IS NULL AND people_administrative_offices.valid_until >= ?)
            OR (people_administrative_offices.valid_from <= ? AND people_administrative_offices.valid_until >= ?))
    `

    const places = [
        today, today,
        unitID, ...qArray, ...labParams, ...groupParams, today, today, today, today,
        unitID, ...qArray, today, today, today, today,
        unitID, ...qArray, today, today, today, today,
        unitID, ...qArray, today, today, today, today
    ]

    try {
        const [people] = await pool.query(querySQL, places)

        if (people.length === 0) {
            return res.json({
                status: 'success', statusCode: 200, count: 0,
                pageSize: undefined, offset: 0, pageCount: 0, result: []
            })
        }

        const personIds = people.map((p) => p.person_id)
        const detailsMap = await fetchMembersDetails(personIds, unitID, moreDetails)

        const result = people.map((p) => ({
            ...p,
            ...(detailsMap.get(p.person_id) || {})
        }))

        res.json({
            status: 'success',
            statusCode: 200,
            count: result.length,
            pageSize: undefined,
            offset: 0,
            pageCount: result.length,
            result
        })
    } catch (err) {
        console.error('Fetch current members list error:', err)
        res.status(500).json({ message: 'Something went wrong - Current Members List' })
    }
}

export async function getPastMembers(req, res) {
    const { unitID } = req.params
    const today = toIsoDateString(new Date())
    const moreDetails = req.query.details === '1'

    const {
        qArray, likeNameExpression, labFilter, labParams,
        groupFilter, groupParams, joinSearchTables
    } = buildQueryFilters(req.query)

    const dateFilter = ` AND ((people_labs.valid_from < ? OR people_labs.valid_from IS NULL)
                            AND (people_labs.valid_until IS NOT NULL AND people_labs.valid_until < ?))`

    const querySQL = `
        SELECT DISTINCT people.id AS person_id, people.user_id, people.name, people.colloquial_name
        FROM people
        JOIN people_labs ON people_labs.person_id = people.id
        JOIN labs ON labs.id = people_labs.lab_id
        JOIN labs_groups ON labs_groups.lab_id = labs.id
            AND (labs_groups.valid_from IS NULL OR labs_groups.valid_from <= people_labs.valid_until)
            AND (labs_groups.valid_until IS NULL OR labs_groups.valid_until >= people_labs.valid_until)
        JOIN \`groups\` ON \`groups\`.id = labs_groups.group_id
        JOIN groups_units ON groups_units.group_id = \`groups\`.id
        ${joinSearchTables}
        WHERE people.status = 1 AND groups_units.unit_id = ? ${likeNameExpression} ${labFilter} ${groupFilter} ${dateFilter}

        UNION

        SELECT DISTINCT people.id AS person_id, people.user_id, people.name, people.colloquial_name
        FROM people
        JOIN technicians ON technicians.person_id = people.id
        JOIN technician_offices ON technician_offices.id = technicians.technician_office_id
        JOIN technicians_units ON technicians_units.technician_id = technicians.id
        ${joinSearchTables}
        WHERE people.status = 1 AND technicians_units.unit_id = ? ${likeNameExpression}
        AND ((technicians.valid_from < ? OR technicians.valid_from IS NULL)
        AND (technicians.valid_until IS NOT NULL AND technicians.valid_until < ?))

        UNION

        SELECT DISTINCT people.id AS person_id, people.user_id, people.name, people.colloquial_name
        FROM people
        JOIN science_managers ON science_managers.person_id = people.id
        JOIN science_manager_offices ON science_manager_offices.id = science_managers.science_manager_office_id
        JOIN science_managers_units ON science_managers_units.science_manager_id = science_managers.id
        ${joinSearchTables}
        WHERE people.status = 1 AND science_managers_units.unit_id = ? ${likeNameExpression}
        AND ((science_managers.valid_from < ? OR science_managers.valid_from IS NULL) AND (science_managers.valid_until IS NOT NULL AND science_managers.valid_until < ?))

        UNION

        SELECT DISTINCT people.id AS person_id, people.user_id, people.name, people.colloquial_name
        FROM people
        JOIN people_administrative_offices ON people_administrative_offices.person_id = people.id
        JOIN administrative_offices ON administrative_offices.id = people_administrative_offices.administrative_office_id
        JOIN people_administrative_units ON people_administrative_units.administrative_id = people_administrative_offices.id
        ${joinSearchTables}
        WHERE people.status = 1 AND people_administrative_units.unit_id = ? ${likeNameExpression}
        AND ((people_administrative_offices.valid_from < ? OR people_administrative_offices.valid_from IS NULL) AND (people_administrative_offices.valid_until IS NOT NULL AND people_administrative_offices.valid_until < ?))
    `

    const places = [
        unitID, ...qArray, ...labParams, ...groupParams, today, today,
        unitID, ...qArray, today, today,
        unitID, ...qArray, today, today,
        unitID, ...qArray, today, today
    ]

    try {
        const [people] = await pool.query(querySQL, places)

        if (people.length === 0) {
            return res.json({
                status: 'success', statusCode: 200, count: 0,
                pageSize: undefined, offset: 0, pageCount: 0, result: []
            })
        }

        const personIds = people.map((p) => p.person_id)
        const detailsMap = await fetchMembersDetails(personIds, unitID, moreDetails)

        const result = people.map((p) => ({
            ...p,
            ...(detailsMap.get(p.person_id) || {})
        }))

        res.json({
            status: 'success',
            statusCode: 200,
            count: result.length,
            pageSize: undefined,
            offset: 0,
            pageCount: result.length,
            result
        })
    } catch (err) {
        console.error('Fetch past members list error:', err)
        res.status(500).json({ message: 'Something went wrong - Past Members List' })
    }
}

export async function getUnits(req, res) {

    try {
        const [rows] = await pool.query(
            'SELECT id, short_name AS name, LOWER(short_name) AS slug FROM units;', [])
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No Units found.' })
        }
        res.json(rows)
    } catch (err) {
        console.error('Fetch unit info error:', err)
        res.status(500).json({ message: 'Something went wrong - Unit Info' })
    }

}