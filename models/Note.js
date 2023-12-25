const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)

const noteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
}, { timestamps: true })

noteSchema.plugin(AutoIncrement, {
    inc_field: 'ticket', //Name of the field
    id: 'ticketNums', //id name of the sequence
    start_seq: 500 //Start num for sequence
});

module.exports = mongoose.model('Note', noteSchema)