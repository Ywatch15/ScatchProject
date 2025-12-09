const userModel = require('../models/user-model')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const generatedToken = require('../utils/generatedToken');

module.exports.registeredUser = async (req, res) => {
    try {
        const { email, password, fullname } = req.body;

        if (!email || !password || !fullname) {
            req.flash('error', 'All fields are required');
            return res.redirect('/');
        }

        const existing = await userModel.findOne({ email });
        if (existing) {
            req.flash('error', 'You are already registered');
            return res.redirect('/');
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await userModel.create({
            email,
            password: hash,
            fullname,
        });

        const token = generatedToken(user);
        res.cookie('token', token);
        req.flash('success', 'Account created successfully');
        return res.redirect('/');
    } catch (err) {
        console.error('Error registering user:', err);
        req.flash('error', 'Could not create user');
        return res.redirect('/');
    }
}

module.exports.loginUser = async (req,res)=>{
    let {email,password} = req.body;


    let user = await userModel.findOne({email:email})
    if(!user){
        req.flash('error', 'Email or password incorrect');
        return res.redirect('/');
    }

    bcrypt.compare(password, user.password, (err, result)=>{
        if(result){
            let token = generatedToken(user)
            res.cookie("token", token)
            // res.send("logged in successfully");
            res.redirect("/shop");
        }else{
            req.flash('error', 'Email or password incorrect');
            return res.redirect('/');
        }
    })
}

module.exports.logout = (req,res)=>{
    res.cookie("token","")
    res.redirect("/")
}