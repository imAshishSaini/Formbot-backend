const mongoose = require('mongoose')
const Schema = mongoose.Schema

const formSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    fields: [
        {
            label: { type: String, },
            type: { type: String, required: true },
            isUserInput: { type: Boolean, default: true },
            placeholder: { type: String, default: '' },
        },
    ],
    responses: [
        {
            data: { type: Object },
            submittedAt: { type: Date, default: Date.now },
        },
    ],
})

const Form = mongoose.model('Form', formSchema)

module.exports = {
    Form,
}
