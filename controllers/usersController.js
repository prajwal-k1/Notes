const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()

    if (!users?.length)
        return res.status(400).json({ message: 'There are no Users' })

    res.json(users)
})

// @desc Create a users
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body

    if (!username || !password || !Array.isArray(roles) || !roles.length)
        return res.status(400).json({ message: 'All fields are required' })

    const duplicate = await User.findOne({ username }).lean().exec()

    if (duplicate)
        return res.status(400).json({ message: 'Username already exists' })

    const hashedPwd = await bcrypt.hash(password, 10)
    const userObject = { username, 'password': hashedPwd, roles }
    const user = await User.create(userObject)

    if (!user)
        return res.status(400).json({ message: 'Create User failed' })
    res.status(201).json({ message: `New User ${username} created successfully` })
})

// @desc Update users
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const { id, username, password, roles, active } = req.body

    if (!id || !username || !password || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean')
        return res.status(400).json({ message: 'All fields are required' })

    const user = await User.findById(id).exec()

    if (!user)
        return res.status(400).json({ message: 'user Not found' })

    const duplicate = await User.findOne({ username }).lean().exec()

    if (duplicate && duplicate?._id.toString() !== id)
        return res.status(409).json({ message: 'Duplicate Username' })

    user.username = username
    user.roles = roles
    user.active = active

    if (password) {
        user.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await user.save()

    res.json({ message: `${updatedUser.username} updated successfully` })
})

// @desc Delete users
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body
    if (!id)
        res.status(400).json({ message: 'User ID required' })

    const note = await Note.findOne({ user: id }).lean().exec()
    if (note)
        return res.status(400).json({ message: 'User has assigned Notes' })

    const user = await User.findById(id).exec()
    if (!user)
        return res.status(400).json({ message: 'User not found' })

    const result = await user.deleteOne()
    res.json({ message: `Username ${result.username} with ID ${result._id} deleted` })
})


module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}