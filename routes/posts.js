const {
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
} = require('../controllers/postsController');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/../uploads`
    })
});
const verifyJWT = require('../middleware/verifyJWT');

router.route('/')
    .get(verifyJWT, getAllPosts)
    .post(verifyJWT, upload.single('image'), createNewPost);
router.route('/:id')
    .delete(verifyJWT, deletePost)
    .get(getPostById);
router.route('/:id/like')
    .put(verifyJWT, addingLikeToPost);
router.route('/:id/dislike')
    .put(verifyJWT, addingDislikeToPost);
router.route('/:postId/comments')
    .post(verifyJWT, addCommentToPost)
    .get(verifyJWT, getAllCommentsForPostId);
router.route('/:postId/comments/:commentId')
    .put(verifyJWT, editComment)
    .delete(verifyJWT, removeCommentFromPost);

module.exports = router
