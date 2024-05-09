const Post = require('../models/Post');
const User = require('../models/User');
const mongoose = require('mongoose');
const { post } = require('../routes/users');
const cloudinary = require('../config/cloudinary');
const uuid = require('uuid');
const crypto = require('crypto');

const getAllPosts = async (req, res) => {

    const posts = await Post.find();

    if (posts.length === 0) {
        return res.json([]);
    }

    res.json(posts);
}

const createNewPost = async (req, res) => {
    const image = req.file?.path;
    const { username } = req;
    if (!image) {
        return res.status(400).json({ message: 'Adding img is required' });
    }

    const foundUser = await User.findOne({ username });

    try {
        const result = await cloudinary.uploader.upload(image, { public_id: uuid.v4() });
        const newPost = await Post.create({
            _id: result.public_id,
            imgUrl: result.secure_url,
            username: username,
            userId: foundUser._id
        });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (err) {
        return res.status(500).json({ message: `There was an error while creating post ${err}` })
    }
}

const deletePost = async (req, res) => {
    const id = req.params.id;
    const { username } = req;
    if (!id) {
        return res.status(400).json({ message: 'Id is not valid.' })
    }
    const foundPost = await Post.findById(id).exec();
    if (!foundPost) {
        return res.status(404).json({ message: 'Post not found.' });
    }
    const foundUser = await User.findOne({ username });
    if (!foundUser) {
        return res.status(404).json({ message: 'User not found.' });
    }
    if (foundPost.userId !== foundUser._id.toString()) {
        return res.sendStatus(403);
    }
    try {
        await cloudinary.uploader.destroy(foundPost._id);
        await Post.deleteOne(foundPost);
        res.status(200).json(foundPost);
    } catch (err) {
        return res.status(500).json({ message: 'Error while deleting post.' + err.message });
    }
};

const getPostById = async (req, res) => {
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({ message: 'Id is not valid.' })
    }
    const foundPost = await Post.findById(id).exec();
    if (!foundPost) {
        return res.status(404).json({ message: 'Post not found.' })
    }
    res.status(200).json(foundPost);
}

const addCommentToPost = async (req, res) => {
    const { comment } = req.body;
    const id = req.params.postId;
    const username = req.username;

    if (!comment) {
        return res.status(400).json({ message: 'Comment is required.' })
    }

    if (!id) {
        return res.status(400).json({ message: 'Id is not valid.' });
    }
    const foundPost = await Post.findById(id).exec();
    if (!foundPost) {
        return res.status(404).json({ message: 'Post not found.' })
    }
    const foundUser = await User.findOne({ username }).exec();
    if (comment) {
        const comm = {
            _id: uuid.v4(),
            userId: foundUser._id,
            username: username,
            comment: comment
        };
        const oldComments = [...foundPost.comments]
        foundPost.comments = [...oldComments, comm];
    }
    try {
        const result = await Post.updateOne({ _id: foundPost._id }, foundPost);
        res.status(200).json(foundPost);
    } catch (err) {
        res.status(500).json({ message: 'Unable to update post.' });
    }
}

const editComment = async (req, res) => {
    const { comment } = req.body;
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    if (!comment) {
        return res.status(400).json({ message: 'Comment is required.' })
    }

    if (!postId || !commentId) {
        return res.status(400).json({ message: 'Id is not valid.' })
    }
    const foundPost = await Post.findById(postId).exec();
    if (!foundPost) {
        return res.status(404).json({ message: 'Post not found.' });
    }
    const foundComment = foundPost.comments.find(com => com._id === commentId);
    if (!foundComment) {
        return res.status(404).json({ message: 'Comment not found.' });
    }
    foundComment.comment = comment;
    await foundPost.save();
    res.status(200).json(foundPost);
}

const removeCommentFromPost = async (req, res) => {
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    if (!postId || !commentId) {
        return res.status(400).json({ message: 'Id is not valid.' })
    }
    const foundPost = await Post.findById(postId).exec();
    if (!foundPost) {
        return res.status(404).json({ message: 'Post not found.' });
    }
    const foundComment = foundPost.comments.find(com => com._id.toString() === commentId);
    if (!foundComment) {
        return res.status(404).json({ message: 'Comment not found.' });
    }
    const findUser = await User.findOne({ username: req.username }).exec();
    if (foundComment.userId !== findUser._id.toString()) {
        return res.sendStatus(403);
    }
    updatedPost = foundPost.comments.filter(com => com._id.toString() !== commentId);
    foundPost.comments = updatedPost;
    await foundPost.save();
    res.status(200).json(foundPost);
}

const getAllCommentsForPostId = async (req, res) => {
    const id = req.params.postId;
    if (!id) {
        return res.status(400).json({ message: 'Id is not valid.' })
    }
    const post = await Post.findById(id);
    res.status(200).json(post.comments);
}

const addingLikeToPost = async (req, res) => {
    const id = req.params.id;
    const { username } = req;

    if (!id) {
        return res.status(400).json({ message: 'Id is not valid.' })
    }
    const foundPost = await Post.findById(id).exec();

    if (!foundPost) {
        return res.status(404).json({ message: 'Post not found.' })
    }

    const foundLike = foundPost.pictureApproved.find(pic => pic.username === username);
    const foundDislike = foundPost.pictureUnapproved.find(pic => pic.username === username);
    const userName = foundPost.username;
    const user = await User.findOne({ username: userName });

    if (foundDislike) {
        const filteredDislikesOnPost = foundPost.pictureUnapproved.filter(post => post.username !== username);
        foundPost.pictureUnapproved = filteredDislikesOnPost;
        user.currencyPoints = user.currencyPoints + 100;
    }

    if (!foundLike) {
        foundPost.pictureApproved.push({ username: username, like: 1 });
        user.currencyPoints = user.currencyPoints + 100;
    }
    else {
        const filteredLikesOnPost = foundPost.pictureApproved.filter(post => post.username !== username);
        foundPost.pictureApproved = filteredLikesOnPost;
        user.currencyPoints = user.currencyPoints - 100;
    }

    try {
        await foundPost.save();
        await user.save();
        res.status(200).json(foundPost);
    } catch (err) {
        res.status(500).json({ message: `Unable to update likes on post. ${err}` });
    }

}

const addingDislikeToPost = async (req, res) => {
    const id = req.params.id;
    const { username } = req;
    if (!id) {
        return res.status(400).json({ message: 'Id is not valid.' })
    }
    const foundPost = await Post.findById(id).exec();

    if (!foundPost) {
        return res.status(404).json({ message: 'Post not found.' })
    }

    const foundDislike = foundPost.pictureUnapproved.find(pic => pic.username === username);
    const foundLike = foundPost.pictureApproved.find(pic => pic.username === username);
    const userName = foundPost.username;
    const user = await User.findOne({ username: userName });

    if (foundLike) {
        const filteredLikesOnPost = foundPost.pictureApproved.filter(post => post.username !== username);
        foundPost.pictureApproved = filteredLikesOnPost;
        user.currencyPoints = user.currencyPoints - 100;
    }

    if (!foundDislike) {
        foundPost.pictureUnapproved.push({ username, dislike: 1 });
        user.currencyPoints = user.currencyPoints - 100;

    } else {
        const filteredDislikesOnPost = foundPost.pictureUnapproved.filter(post => post.username !== username);
        foundPost.pictureUnapproved = filteredDislikesOnPost;
        user.currencyPoints = user.currencyPoints + 100;
    }

    try {

        await foundPost.save();
        user.save();
        res.status(200).json(foundPost);
    } catch (err) {
        res.status(500).json({ message: `Unable to update dislikes on post. ${err}` });
    }
}

module.exports =
{
    getAllPosts,
    createNewPost,
    deletePost,
    getPostById,
    addCommentToPost,
    getAllCommentsForPostId,
    addingLikeToPost,
    addingDislikeToPost,
    editComment,
    removeCommentFromPost
}