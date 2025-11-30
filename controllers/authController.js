const userModel = require('../models/user-model')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const generatedToken = require('../utils/generatedToken');

module.exports.registeredUser = async (req, res) => {
    try{
        let {email, password, fullname} = req.body;

        let user=await userModel.findOne({email:email})
        if(user) return res.status(401).send("You are already registered");

        bcrypt.genSalt(10, (err,salt)=>{
            bcrypt.hash(password, salt, async function(err,hash){
                if(err) return res.send(err.message);
                else {
                    let user = await userModel.create({
                    email,
                    password:hash,
                    fullname,
                    });

                    let token = generatedToken(user)
                    res.cookie("token",token)
                    res.send("user created successfully");
                }

            })
        })
        
    } catch(err){
        res.send(err.message);   
    }
}

module.exports.loginUser = async (req,res)=>{
    let {email,password} = req.body;


    let user = await userModel.findOne({email:email})
    if(!user) return res.send("Email or password incorrect")

    bcrypt.compare(password, user.password, (err, result)=>{
        if(result){
            let token = generatedToken(user)
            res.cookie("token", token)
            res.send("logged in successfully");
        }else{
            return res.send("Email or password incorrect")
        }
    })
}