const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/scatch')

const userSchema = mongoose.Schema({
    username:String,
    email:String,
    cart:{
        type:Array,
        default:[]
    },
    isadmin:{
        type:Boolean,
        default:false
    },
    orderes:{
        type:Array,
        default:[]
    },
    contact:Number,
    picture: String,
});

module.exports = mongoose.model('users', userSchema)