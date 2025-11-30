const express = require("express");  
const router = express.Router();
const isLoggedin = require("../middleware/isLoggedin")


router.get("/", (req,res)=>{
  let err = req.flash("error");
  res.render("index", {err});
})

router.get("/shop", isLoggedin, (req,res)=>{
  res.render("shop");
})

module.exports = router;