const mongoose = require('mongoose');
const { Schema } = mongoose;


const screenshotSchema = new Schema({
    title: String, // String is shorthand for {type: String}
    url: String,
    pathname:String,
    directory:String,
    hostname:String,
    Screentype:String,
    dimensions:[Number],
    date: { type: Date, default: Date.now },
});


const Screenshots = mongoose.model("Screenshots", screenshotSchema);

module.exports =  Screenshots;