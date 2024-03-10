const express = require('express');
const router = express.Router();
const { registerNewUser, loginUser, deleteUser, refreshToken, logoutUser, getUserByUsername, getTopUsersByPoints } = require('../controllers/usersController');
const verifyJWT = require('../middleware/verifyJWT');

router.post('/register', registerNewUser);
router.post('/login', loginUser);
router.post('/logout', verifyJWT, logoutUser);
router.get('/refresh', refreshToken);
router.get('/:username', verifyJWT, getUserByUsername);
router.get('/top-users/:top', verifyJWT, getTopUsersByPoints);
router.delete('/', verifyJWT, deleteUser);

module.exports = router;