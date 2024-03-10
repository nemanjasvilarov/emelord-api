const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    _id: String,
    userId: String,
    username: String,
    comment: String
});

const postSchema = new Schema([{
    _id: String,
    imgUrl: String,
    username: String,
    userId: String,
    pictureApproved: [{ username: String, like: Number }],
    pictureUnapproved: [{ username: String, dislike: Number }],
    comments: [commentSchema]
}]);

module.exports = mongoose.model('Post', postSchema)