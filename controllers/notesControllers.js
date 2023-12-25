const Note = require('../models/Note')
const User = require('../models/User')
const asyncHandler = require('express-async-handler')

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean()

    if (!notes?.length)
        return res.status(400).json({ message: 'No notes found.' })

    const notesWithUsers = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))

    res.json(notesWithUsers)
})
// @desc Create new notes
// @route POST /notes
// @access Private
const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body

    if (!user || !title || !text)
        return res.status(400).json({ message: 'All fields are required' })

    const duplicate = await Note.findOne({ title }).lean().exec()

    if (duplicate)
        return res.status(409).json({ message: 'Duplicate note Title' })

    const noteObject = { user, title, text }
    const note = await Note.create(noteObject)

    if (!note)
        return res.status(400).json({ message: 'Note creation failed' })
    res.json(`Note ${note.title} created Successfully`)
})

// @desc Update notes
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body

    if (!id || !user || !title || !text || typeof completed !== 'boolean')
        return res.status(400).json({ message: 'All fields are required' })

    const note = await Note.findById(id).exec()

    if (!note)
        return res.status(400).json({ message: 'Note not found' })

    const duplicate = await Note.findOne({ title }).lean().exec()

    if (duplicate && duplicate?._id !== id)
        return res.status(409).json({ message: 'Duplicate Note Title' })

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await note.save()
    res.json(`Note ${updateNote.title} updated successfully`)
})
// @desc Delete notes
// @route DELETE /notes
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body

    if (!id)
        return res.status(400).json({ message: 'Note ID required.' })

    const note = await Note.findById(id).exec()

    if (!note)
        return res.status(400).json({ message: 'Note not found.' })

    const result = await note.deleteOne()
    res.json({ message: `Note ${result.title} deleted successfully` })
})

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}