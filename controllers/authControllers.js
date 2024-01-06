const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')

// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body

    if (!username || !password)
        return res.status(400).json({ message: 'Username and password required' })

    const userFound = await User.findOne({ username }).exec()

    if (!userFound || !userFound.active)
        return res.status(401).json({ message: 'Unauthorized' })

    const isPassCorrect = await bcrypt.compare(password, userFound.password)

    if (!isPassCorrect)
        return res.status(401).json({ message: 'Incorrect password' })

    const accessToken = jwt.sign(
        {
            'UserInfo': {
                'username': userFound.username,
                'roles': userFound.roles
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '10m' }
    )
    const refreshToken = jwt.sign(
        { 'username': userFound.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '2d' }
    )

    // Create secure cookie with refresh token 
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, //accessible only by web server 
        secure: true, //https
        sameSite: 'None', //cross-site cookie 
        maxAge: 1000 * 60 * 60 * 24 * 2 //cookie expiry: set to match refreshToken
    })

    res.json({ 'accessToken': accessToken })
})

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
    const cookie = req.cookies

    if (!cookie?.refreshToken)
        return res.status(401).json({ message: 'Unauthorized access' })

    const token = cookie.refreshToken

    jwt.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async (err, decoded) => {
            if (err)
                return res.status(403).json('Forbidden')

            const userFound = await User.findOne({ username: decoded.username }).exec()

            if (!userFound)
                return res.status(401).json({ message: 'User not found' })

            const accessToken = jwt.sign(
                {
                    'UserInfo': {
                        'username': decoded.username,
                        'roles': decoded.roles
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: 1000 * 60 }
            )

            res.json({ 'accessToken': accessToken })
        }))
}

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
    const cookie = req.cookies

    if (!cookie?.refreshToken)
        return res.status(204).json({ message: 'No cookie content' })

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
    })

    res.json({ message: 'Cookie cleared' })
}

module.exports = { login, refresh, logout }