const express = require('express')
const { Form } = require('../schema/form.schema')
const { Folder } = require('../schema/folder.schema')
const { Workspace } = require('../schema/workspace.schema')
const router = express.Router()

// Create a form in a folder
router.post('/create', async (req, res) => {
  const { name, fields, folderId, workspaceId } = req.body
  if (!name || !fields || (!folderId && !workspaceId)) {
    return res.status(400).json({ message: 'Name, fields, and folder or workspace are required' })
  }
  try {
    const form = new Form({ name, fields, responses: [] })
    await form.save()

    if (folderId) {
      const folder = await Folder.findById(folderId)
      folder.forms.push(form._id)
      await folder.save()
    } else if (workspaceId) {
      const workspace = await Workspace.findById(workspaceId)
      workspace.forms.push(form._id)
      await workspace.save()
    }

    res.status(201).json(form)
  } catch (error) {
    res.status(500).json({ message: 'Error creating form', error })
  }
})

router.get('/', async (req, res) => {
  const { workspaceId, folderId } = req.query

  try {
    if (folderId) {
      const folder = await Folder.findById(folderId).populate('forms')
      return res.json(folder.forms)
    } else if (workspaceId) {
      const workspace = await Workspace.findById(workspaceId).populate('forms')
      return res.json(workspace.forms)
    }

    res.status(400).json({ message: 'Provide either workspaceId or folderId' })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching forms', error })
  }
})

// Delete a form
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const form = await Form.findByIdAndDelete(id)
    if (!form) {
      return res.status(404).json({ message: 'Form not found' })
    }

    // Remove form from folder or workspace
    await Folder.updateMany({ forms: id }, { $pull: { forms: id } })
    await Workspace.updateMany({ forms: id }, { $pull: { forms: id } })

    res.json({ message: 'Form deleted', form })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting form', error })
  }
})

router.post('/save', async (req, res) => {
  const { formId, name, fields } = req.body

  if (!name || !fields) {
      return res.status(400).json({ message: 'Name and fields are required.' })
  }

  try {
    const form = await Form.findById(formId)

      form.name = name
      form.fields = fields
      await form.save()

      res.status(201).json({ message: 'Form saved successfully', formId: form._id })
  } catch (error) {
      res.status(500).json({ message: 'Error saving form', error })
  }
})

router.get('/:id', async (req, res) => {
  const id = req.params.id
  console.log(id)

  try {
      const form = await Form.findById(id)
      console.log(form)
      if (!form) return res.status(404).json({ message: 'Form not found' })

      res.json(form)
  } catch (error) {
      res.status(500).json({ message: 'Error fetching form', error })
  }
})


router.post('/:id/fill', async (req, res) => {
  const { id } = req.params
  const userData = req.body

  try {
      const form = await Form.findById(id)
      if (!form) return res.status(404).json({ message: 'Form not found' })

      form.responses.push({ data: userData })
      await form.save()
      res.json({ message: 'Response submitted successfully', form })
  } catch (error) {
      res.status(500).json({ message: 'Error submitting response', error })
  }
})



module.exports = router
