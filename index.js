require('dotenv').config()
const express = require('express');
const cors = require('cors');
require('./db/config');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer'); // for email
const User = require('./db/User');
const Schedule = require('./db/Schedule');
const moment = require('moment'); // for time
// const Product = require('./db/Product');
// const User = require('./')

const app = express();

app.use(express.json());
app.use(cors());

// email cred
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ESP_EMAIL,
      pass: process.env.ESP_APP_PASSWORD
    }
  });

app.post('/api/auth/signup', async (req, resp) => {
    let query = await User.findOne({ "p_email": req.body.p_email })

    if (query) {
        return resp.status(201).json({ msg: "User already exists.", status: "danger" });
    } else {
        let user = new User(req.body);
        let result = await user.save();
        // result = result.toObject();
        // delete result.password
        // localStorage.setItem("medikit-email", req.body.p_email);
        return resp.status(200).json({ msg: "User created successfully.", status: "success" });
    }

    // console.log("qlogin", query)


})
app.post('/api/auth/login', async (req, resp) => {
    // console.log(req.body)
    if (req.body.p_password && req.body.p_email) {
        let user = await User.findOne({ "p_email": req.body.p_email });
        // console.log("user", user)
        if (user) {
            if (user.p_password == req.body.p_password) {
                return resp.status(200).json({ msg: "User login successfully.", status: "success" });
            } else {
                return resp.status(201).json({ msg: 'Login Failed! User ID or Password is wrong..', status: "danger" })
            }
        } else {
            return resp.status(201).json({ msg: 'Login Failed! User ID or Password is wrong..', status: "danger" })
        }

    } else {
        return resp.status(201).json({ msg: 'Email & Password can not be empty..', status: "danger" })
    }
})

//add time
app.post('/api/data/schedule-add', async (req, resp) => {
    if (req.body.s_time && req.body.s_activation && req.body.p_email) {
        let query = await Schedule.findOne({ "p_email": req.body.p_email, "s_time": req.body.s_time });
        console.log("querytimeadd", query)
        if (!query) {
            let saveSchedule = new Schedule(req.body);
            await saveSchedule.save();
            return resp.status(200).json({ msg: "Schedule saved successfully.", status: "success" });
        } else {
            return resp.status(201).json({ msg: 'Time is already assigned.', status: "danger" })
        }

    } else {
        return resp.status(201).json({ msg: 'Fields can not be empty..', status: "danger" })
    }
})

// time delete
app.delete('/api/data/schedule-delete/:id', async (req, resp) => {
    let query = await Schedule.deleteOne({ _id: req.params.id })
    console.log("querytimedelete", query)
    if (query.deletedCount) {
        return resp.status(200).json({ msg: "Schedule deleted successfully.", status: "success" });
    } else {
        return resp.status(201).json({ msg: 'No time found.', status: "danger" })
    }
})

// time update
app.put('/api/data/schedule-update/:id', async (req, resp) => {
    if (req.body.s_time && req.body.s_activation && req.body.p_email) {
        let findIdIfExist = await Schedule.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) })
        if (findIdIfExist) {
            let query = await Schedule.findOne({ "_id": { "$ne": req.params.id }, "p_email": req.body.p_email, "s_time": req.body.s_time })
            console.log("querytimeUpdateFind", query)
            if (!query) {
                await Schedule.updateOne(
                    { _id: req.params.id }, // find
                    { $set: req.body } // replace with   
                ).then(function (res) {
                    /*console.log("udpade res", res)
                    if (res.modifiedCount>0) {
                        return resp.status(200).json({ msg: "Schedule updated successfully.", status: "success" });
                    } else {
                        return resp.status(201).json({ msg: 'Time cannot be updated. Try again.', status: "danger" }) 
                    }*/
                    return resp.status(200).json({ msg: "Schedule updated successfully.", status: "success" });
                })
            } else {
                return resp.status(201).json({ msg: 'Time already assigned and cannot be updated.', status: "danger" })
            }
        } else {
            return resp.status(201).json({ msg: 'No time found.', status: "danger" })
        }
    } else {
        return resp.status(201).json({ msg: 'Fields can not be empty..', status: "danger" })
    }
})

// all time show 
app.post('/api/data/schedule-all/:p_email', async (req, resp) => {
    let query = await Schedule.find({ p_email: req.params.p_email });
    if (query.length > 0) {
        resp.status(200).json(query);
    } else {
        resp.send({ result: "No record found.", status: "danger" })
    }
});

// get activation for esp
app.get('/api/esp32/activate/:p_email/:no', async (req, res) => {
    const date = new Date();
    const local_time = moment(date).format('HH:mm');
    // console.log(local_time);

    let query = await Schedule.findOne({ p_email: req.params.p_email, s_time: local_time });
    console.log("iot-activ-query", query)
    if (query && req.params.no>=0 && req.params.no<4) {
        return res.send(query.s_activation[req.params.no])
    } else if (query && req.params.no==4) {
        return res.send(query.s_activation)
    } else {
        return res.send('null')
    }
})

// send email no medi taken
app.get('/api/esp32/send/:p_email', async (req, res) => {
    // console.log(req.params.p_email)
    const info = await transporter.sendMail({
        from: process.env.ESP_EMAIL, // sender address
        to: req.params.p_email, // list of receivers
        subject: "Medicine Schedule Alert", // Subject line
        text: "You missed a medicine schedule.", // plain text body
      });
    
      console.log("Message sent: %s", info.messageId);
      return res.send('sent')
})

const port = 3001;
app.listen(port);
console.debug('Server listening on port ' + port);