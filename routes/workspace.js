const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Workspace } = require('../schema/workspace.schema')
const { User } = require('../schema/user.schema')
const dotenv = require('dotenv')
const authMiddleware = require('../middleware/auth')
dotenv.config()

router.get('/', authMiddleware, async (req, res) => {
    console.log(req.user)
    try {
        const userId = req.user.id

        console.log(userId)
        const user = await User.findById(userId)
            .populate('workspace', 'name owner') 
            .populate({
                path: 'sharedWorkspaces.workspace',
                select: 'name owner',
                populate: { path: 'owner', select: 'name' },
            })

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const userWorkspaces = user.workspace.map((ws) => ({
            id: ws._id,
            name: ws.name,
            ownerName: user.name,
        }))

        const sharedWorkspaces = user.sharedWorkspaces.map((shared) => ({
            id: shared.workspace._id,
            name: shared.workspace.name,
            ownerName: shared.workspace.owner.name,
            permission: shared.permission,
        }))

        res.status(200).json({ userWorkspaces, sharedWorkspaces })
    } catch (error) {
        console.error('Error fetching workspaces:', error)
        res.status(500).json({ message: 'Failed to fetch workspaces', error })
    }
})

router.post('/:workspaceId/invite', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params
    const { email, permission } = req.body
  
    try {
      const userToInvite = await User.findOne({ email })
      if (!userToInvite) {
        return res.status(404).json({ message: 'User not found with the provided email' })
      }
  
      const workspace = await Workspace.findById(workspaceId)
      if (!workspace) {
        return res.status(404).json({ message: 'Workspace not found' })
      }
  
      const alreadyShared = userToInvite.sharedWorkspaces.find(
        (shared) => shared.workspace.toString() === workspaceId
      )
      if (alreadyShared) {
        return res.status(400).json({ message: 'User already has access to this workspace' })
      }
  
      userToInvite.sharedWorkspaces.push({ workspace: workspaceId, permission })
      await userToInvite.save()
  
  
      res.status(200).json({ message: 'Invite sent successfully!' })
    } catch (error) {
      console.error('Error sending invite:', error)
      res.status(500).json({ message: 'Failed to send invite', error })
    }
  })
  
  

router.post('/:workspaceId/share', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params
    const { permission } = req.body
    try {
        const user = req.user
        const token = jwt.sign(
            { workspaceId, ownerId: user.id, permission },
            process.env.JWT_SECRET,
        )
        const shareableLink = `${req.protocol}://${req.get('host')}/api/workspace/access/${token}`
        res.status(200).json({ link: shareableLink })
    } catch (error) {
        console.error('Error generating share link:', error)
        res.status(500).json({ message: 'Failed to generate share link', error })
    }
})

router.get('/access/:token', authMiddleware, async (req, res) => {
    const { token } = req.params
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const { workspaceId, ownerId, permission } = decoded

        const user = req.user
        const alreadyAdded = user.sharedWorkspaces.find(
            (ws) => ws.workspace.toString() === workspaceId
        )

        if (alreadyAdded) {
            return res.status(400).json({ message: 'Workspace already added' })
        }

        user.sharedWorkspaces.push({ workspace: workspaceId, permission })
        await user.save()

        res.status(200).json({ message: 'Workspace added to shared workspaces' })
    } catch (error) {
        console.error('Error accessing shared workspace:', error)
        res.status(500).json({ message: 'Failed to access shared workspace', error })
    }
})


module.exports = router