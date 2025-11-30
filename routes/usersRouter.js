const express = require('express');
const router = express.Router();
const {registeredUser} = require("../controllers/authController")

router.get('/',(req,res)=>{
    res.send('hey it is working');
})

router.post("/register", registeredUser);

router.post("/login")

module.exports = router;