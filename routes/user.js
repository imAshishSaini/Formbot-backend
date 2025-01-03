const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { User } = require('../schema/user.schema')
const { Workspace } = require('../schema/workspace.schema')
const dotenv = require('dotenv')
const authMiddleware = require('../middleware/auth')
dotenv.config()

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body

        const isUserExists = await User.findOne({ email })
        if (isUserExists) {
            return res.status(400).json({ message: 'User already exists' })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new User({ name, email, password: hashedPassword })
        await user.save()
        const workspace = new Workspace({ name: `${name}'s Workspace`, owner: user._id });
        console.log(workspace)
        await workspace.save();
        user.workspace = workspace._id;
        await user.save();
        console.log('User registered:', user)
        res.status(201).send({ message: 'User registered successfully' })
    } catch (error) {
        console.error('Error during registration:', error)
        res.status(500).send({ message: 'User registration failed', error })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
        res.status(200).json({ token })
    } catch (error) {
        console.error('Error during login:', error)
        res.status(500).json({ message: 'Login failed', error })
    }
})

router.get('/validate-token', authMiddleware, (req, res) => {
    res.status(200).json({ message: 'Token is valid', user: req.user });
});


router.get('/setting', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }
        res.status(200).json(user)
    } catch (error) {
        console.error('Error fetching user:', error)
        res.status(500).json({ message: 'Failed to fetch user data' })
    }
})

router.post('/update', authMiddleware, async (req, res) => {
    const { name, updateEmail, oldPassword, newPassword } = req.body
    console.log(name, updateEmail, oldPassword, newPassword)

    try {
        const user = await User.findById(req.user.id)

        if (name == null) {
            name = user.name
        }

        if (updateEmail && updateEmail !== user.email) {
            const emailExists = await User.findOne({ email: updateEmail })
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' })
            }
            user.email = updateEmail
        }

        if(oldPassword) {
            const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password)
            if (!isOldPasswordValid) {
                return res.status(400).json({ message: 'Old password is incorrect' })
            }
        }

        if (name) user.name = name

        if (newPassword) {
            const hashedNewPassword = await bcrypt.hash(newPassword, 10)
            user.password = hashedNewPassword
        }

        await user.save()
        res.status(200).json({ message: 'Profile updated successfully' })
    } catch (error) {
        console.error('Error updating user:', error)
        res.status(500).json({ message: 'User update failed', error })
    }
})

module.exports = router