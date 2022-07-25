import mongoose from 'mongoose';
const { Schema } = mongoose;

const blogSchema = new Schema({
    title: String, // String is shorthand for {type: String}
    date: String,
    type: String,
    hostname: String,
    date: { type: Date, default: Date.now },
    hidden: Boolean
});


export default blogSchema