const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/scatch')

const ownerSchema = mongoose.Schema({
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
    products:{
        type:Array,
        default:[]
    },
    gstin:String,
    picture: String,
});

module.exports = mongoose.model('owner', ownerSchema)