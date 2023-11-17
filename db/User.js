const mongoose = require ('mongoose');

const userSchema= new mongoose.Schema({
    p_name:String,
    p_email:String,
    p_alt_email:String,
    p_password:String
})
module.exports = mongoose.model('users',userSchema);

