const  mongoose = require('mongoose');
const { Schema } = mongoose;

const directorySchema = new Schema({
    title: String, // String is shorthand for {type: String}
    url: String,
    hostname: String,
    date: { type: Date, default: Date.now },
});

const Pages = mongoose.model("Directories", directorySchema);

module.exports = Pages; 