const express = require('express');
const router = express.Router();
const {registeredUser, loginUser} = require("../controllers/authController")

router.get('/',(req,res)=>{
    res.send('hey it is working');
})

router.post("/register", registeredUser);

router.post("/login", loginUser)

module.exports = router;