const express = require('express');
const router = express.Router();
const isLoggedin = require("../middleware/isLoggedin")
const {registeredUser, loginUser, logout} = require("../controllers/authController")

router.get('/',(req,res)=>{
    res.send('hey it is working');
})

router.post("/register", registeredUser);

router.post("/login", loginUser)

router.get("/logout", logout)

module.exports = router;