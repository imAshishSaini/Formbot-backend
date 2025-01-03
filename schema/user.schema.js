const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    workspace: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace'
        },
    ],
    sharedWorkspaces: [
        {
            workspace: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Workspace'
            },
            permission: {
                type: String,
                enum: ['edit', 'view'],
                default: 'edit'
            }
        }
    ],
    creationDate: {
        type: Date,
        default: Date.now,
    }
});

const User = mongoose.model('User', userSchema);

module.exports = {
    User,
};
