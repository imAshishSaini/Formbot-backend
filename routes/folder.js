const express = require('express')
const { Folder } = require('../schema/folder.schema')
const { Form } = require('../schema/form.schema')
const { Workspace } = require('../schema/workspace.schema')
const router = express.Router()

router.get('/', async (req, res) => {
  const { workspaceId } = req.query; // Extract workspaceId from query params
  if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
  }
  try {
      const workspace = await Workspace.findById(workspaceId).populate('folders'); // Fetch workspace and populate folders
      if (!workspace) {
          return res.status(404).json({ message: 'Workspace not found' });
      }

      console.log(workspace.folders)
      res.json(workspace.folders); // Return folders of the workspace
  } catch (error) {
      console.error('Error fetching folders:', error.message);
      res.status(500).json({ message: 'Error fetching folders', error: error.message });
  }
});


router.post('/create', async (req, res) => {
  const { name, selectedWorkspaceId } = req.body
  if (!name) {
    return res.status(400).json({ message: 'Folder name is required' })
  }
  try {
    const existingFolder = await Folder.findOne({ name })
    if (existingFolder) {
      return res.status(400).json({ message: 'Folder name already exists' })
    }

    const folder = new Folder({ name, forms: [] })
    await folder.save()

    const workspace = await Workspace.findById(selectedWorkspaceId)
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' })
    }
    workspace.folders.push(folder._id)
    console.log(workspace)
    await workspace.save()
    console.log(workspace)

    res.status(201).json(folder)
  } catch (error) {
    console.error('Error creating folder:', error.message)
    res.status(500).json({ message: 'Error creating folder', error:error.message })
  }
})

// Delete a folder
router.delete('/:id', async (req, res) => {
  try {
    const folderId = req.params.id

    // Find the folder to get the associated workspace
    const folder = await Folder.findById(folderId)
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' })
    }

    // Remove the folder from all workspaces that reference it
    const workspaces = await Workspace.find({ folders: folderId })
    if (workspaces.length > 0) {
      await Promise.all(
        workspaces.map(async (workspace) => {
          workspace.folders = workspace.folders.filter(
            (id) => id.toString() !== folderId
          )
          await workspace.save()
        })
      )
    }

    // Delete the folder itself
    await Folder.findByIdAndDelete(folderId)

    res.json({ message: 'Folder deleted successfully', folder })
  } catch (error) {
    console.error('Error deleting folder:', error.message)
    res.status(500).json({ message: 'Error deleting folder', error: error.message })
  }
})


module.exports = router
