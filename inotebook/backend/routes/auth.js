const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs'); 
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = 'Jyotsnaisagoodg$irl';

// ROUTE 1 : Create a user using: POST "/api/auth/createuser". No login require
router.post('/createuser',[
    body('name', 'Enter a valid name').isLength({ min: 3}),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Passwords must be atleast 5 characters').isLength({ min: 5}),
] , async (req, res)=>{
    let success = false;

// If there are errors, return bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

// check whether the users with this email exist already
    try {
    let user = await User.findOne({email: req.body.email});
    if(user){
        return res.status(400).json({success, error: "Sorry a user with this email already exists"})
    }
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password, salt);
    user = await User.create({
        name: req.body.name,
        password: secPass,
        email: req.body.email,
    });
    const data = {
        user:{
            id: user.id
        }
    }
    const authtoken = jwt.sign(data, JWT_SECRET);
    // res.json(user)
    success = true;
    res.json({success, authtoken})
} catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server error");
    }
})

// ROUTE 2 : Authenticate a user using: POST "/api/auth/login". No login require
router.post('/login',[
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'password cannot be blank').exists(),
] , async (req, res)=>{
    let success = false;

// If there are errors, return bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password} = req.body;
    try {
        let user = await User.findOne({email});
        if(!user){
            success = false;
            return res.status(400).json({error: 'Please try to login with correct credentials'});
        }

        const passwordCompare = await bcrypt.compare(password, user.password);
        if(!passwordCompare){
            success = false;
            return res.status(400).json({success, error: 'Please try to login with correct credentials'});
        }

        const data = {
            user:{
                id: user.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({success, authtoken})

    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal server error");
    }
})

// ROUTE 3 : Get loggedin user details using: POST "/api/auth/getuser". login require
router.post('/getuser', fetchuser, async (req, res)=>{
try {
  userId = req.user.id;
  const user = await User.findById(userId).select("-password")
  res.send(user)
} catch (error) {
  console.log(error.message);
  res.status(500).send("Internal server error");
}
})
module.exports = router