const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    fullname:{
        type:String,
        trim:true,
        minLength:3
    },
    email:String,
    cart:{
        type:Array,
        default:[]
    },
    isadmin:{
        type:Boolean,
        default:false
    },
    orders:{
        type:Array,
        default:[]
    },
    contact:Number,
    picture: String,
});

module.exports = mongoose.model('user', userSchema)