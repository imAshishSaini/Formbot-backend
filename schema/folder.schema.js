const mongoose = require('mongoose')
const Schema = mongoose.Schema

const folderSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    forms: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Form',
        },
    ],
})

const Folder = mongoose.model('Folder', folderSchema)

module.exports = {
    Folder,
}
