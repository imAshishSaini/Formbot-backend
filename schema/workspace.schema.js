const mongoose = require('mongoose')
const Schema = mongoose.Schema

const workspaceSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    folders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder',
        },
    ],
    forms: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Form',
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
})

const Workspace = mongoose.model('Workspace', workspaceSchema)

module.exports = {
    Workspace,
}