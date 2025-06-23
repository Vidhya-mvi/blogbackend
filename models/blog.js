const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "title is required"],
        },
        content: {
            type: String,
            required: [true, "content is required"],
        },
        postedBy: {
            type: ObjectId,
            ref: "User",
        },
        image: {
           type:String,
           default:""
        },
        genre: { 
            type: String, 
            required: true,
            lowercase: true 
        },
        likes: [{ type: ObjectId, ref: "User" }],
        comments: [
            {
                text: String,
                created: { type: Date, default: Date.now },
                postedBy: {
                    type: ObjectId,
                    ref: "User",
                },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);