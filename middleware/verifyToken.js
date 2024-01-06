const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
    const reqHeader = req.header.authorization || req.header.Authorization

    if (!reqHeader?.startsWith('Bearer '))
        return res.status(401).json({ message: 'Unauthorized access' })

    const token = reqHeader.split(' ')[1]

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err)
                return res.status(403).json({ message: 'Forbidden' })

            req.username = decoded.username
            req.roles = decoded.roles

            next()
        }
    )
}

module.exports = verifyToken