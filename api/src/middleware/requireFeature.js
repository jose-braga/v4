import { getFeatures } from '../utils/features'

export function requireFeature(feature) {
    return async (req, res, next) => {
        const features = await getFeatures(req.user.personId)   // shared with /me
        if (!features.includes(feature)) {
            return res.status(403).json({ message: 'You do not have permission to access that resource.' })
        }
        next()
    }
}