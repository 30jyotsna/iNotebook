const express = require('express');
const router = express.Router();
var fetchuser = require('../middleware/fetchuser');
const Note = require('../models/Note')
const { body, validationResult } = require('express-validator');

// ROUTE 1 : Get all the notes using: GET "/api/notes/createuser". No login require
router.get('/fetchallnotes', fetchuser, async (req, res)=>{
    try {
    const notes = await Note.find({user: req.user.id});
    res.json(notes)
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server error");
    }
})

// ROUTE 2 : Add a new Note using: POST "/api/notes/addnote". No login require
router.post('/addnote', fetchuser, [
    body('title', 'Enter a valid title').isLength({ min: 3}),
    body('description', 'Description must be atleast 5 characters').isLength({ min: 5}),
], async (req, res)=>{
    try {
    const {title, description, tag} = req.body;

// If there are errors, return bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const note = new Note({
        title, description, tag, user: req.user.id
    })
    const saveNote = await note.save()

    res.json(saveNote) 
}   catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server error");
    }
})

// ROUTE 3 : Update an existing notes using: PUT "/api/notes/updatenote". login require
router.put('/updatenote/:id', fetchuser, async (req, res)=>{
    const {title, description, tag} = req.body;
    try {
    // create a newNote object
    const newNote = {};
    if(title){newNote.title = title};
    if(description){newNote.description = description};
    if(tag){newNote.tag = tag};

    // find the note to be updated
    let note = await Note.findById(req.params.id);
    if(!note){res.status(404).send("Not Found")}
    if(note.user.toString() !== req.user.id){
        return res.status(401).send("Not Allowed");
    }
    note = await Note.findByIdAndUpdate(req.params.id, {$set: newNote}, {new:true})
    res.json({note});
} catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
}
})

// ROUTE 4 : Delete an existing notes using: DELETE "/api/notes/deletenote". login require
router.delete('/deletenote/:id', fetchuser, async (req, res)=>{
try{
    // find the note to be deleted
    let note = await Note.findById(req.params.id);
    if(!note){return res.status(404).send("Not Found")}

    // Allow deletion only if user owns this Note
    if(note.user.toString() !== req.user.id){
        return res.status(401).send("Not Allowed");
    }
    note = await Note.findByIdAndDelete(req.params.id)
    res.json({ "Success": "Note has been deleted", note: note});
} catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
}
})
module.exports = router