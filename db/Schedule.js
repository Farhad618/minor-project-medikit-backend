const mongoose = require ('mongoose');

const scheduleSchema= new mongoose.Schema({
    p_email: String,
    s_time: String,
    s_activation: String,
    s_margedBinFormat: String
});
module.exports = mongoose.model('schedules',scheduleSchema);
