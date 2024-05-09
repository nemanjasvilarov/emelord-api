const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const userRegisterSchema = require('../validation/userValidation/userRegisterSchema');
const userLoginSchema = require('../validation/userValidation/userLoginSchema');

const registerNewUser = async (req, res) => {

    const user = JSON.parse(JSON.stringify(req.body));

    try {
        await userRegisterSchema.validate(user, { abortEarly: false });
    } catch (err) {
        const errors = [];
        err.inner.map(e => {
            errors.push({ field: e.path, message: e.message })
        })
        return res.status(400).json(errors);
    }

    const duplicate = await User.findOne({ username: user.username }).exec();

    if (duplicate) {
        return res.status(409).json({ message: 'User with that username already exists.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const newUser = await User.create({
            _id: uuid.v4(),
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            password: hashedPassword,
            currencyPoints: 0
        });

        newUser.save();
        res.status(201).json({ 'message': `User ${newUser.username} has been created.` });
    } catch (err) {
        res.status(500).json({ 'message': err.message });
    }
}

const loginUser = async (req, res) => {
    const userInput = JSON.parse(JSON.stringify(req.body));

    try {
        await userLoginSchema.validate(userInput, { abortEarly: false });
    } catch (err) {
        const errors = [];
        err.inner.map(e => {
            errors.push({ field: e.path, message: e.message })
        })
        return res.status(400).json(errors);
    }

    const user = await User.findOne({ username: userInput.username }).exec();
    if (!user) {
        return res.status(400).json({ message: `Wrong username or password.` });
    }
    const match = await bcrypt.compare(userInput.password, user.password);
    if (!match) {
        return res.status(400).json({ message: `Wrong username or password.` });
    }
    const accessToken = jwt.sign(
        { username: user.username },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { username: user.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' }
    );
    try {
        user.refreshToken = refreshToken;
        await user.save();
    } catch (err) {
        return res.status(500).json({ "message": "There was an error while updating user." });
    }
    res.cookie('jwt', refreshToken, {
        httpOnly: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000, secure: true
    });//secure:true in production
    res.json({ accessToken });
}

const logoutUser = async (req, res) => {

    const cookie = req.cookies;
    if (!cookie?.jwt) {
        return res.sendStatus(204);
    }

    const refreshToken = cookie.jwt;
    const foundUser = await User.findOne({ refreshToken }).exec();

    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
        return res.sendStatus(403);
    }

    try {
        foundUser.refreshToken = '';
        await foundUser.save();
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
        res.status(200).json({ message: 'User was successfully loged out' });
    } catch (err) {
        return res.status(500).json({ message: `There was an error: ${err}` });
    }

}

const deleteUser = async (req, res) => {
    const username = req.username;
    if (!username) {
        return res.sendStatus(403);
    }
    const foundUser = await User.findOne({ username }).exec();
    if (!foundUser) {
        return res.status(404).json({ message: 'User not found' });
    }
    try {
        await User.deleteOne(foundUser);
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        res.status(200).json(foundUser);
    } catch (err) {
        return res.status(500).json({ message: `There was an error while deleting user. ${err}` });
    }
}

const getUserByUsername = async (req, res) => {

    const username = req.params.username;

    if (!username) {
        return res.sendStatus(401);
    }

    const foundUser = await User.findOne({ username });

    if (!foundUser) {
        return res.status(404).json({ message: 'User not found' });
    }

    const user = {
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        email: foundUser.email,
        username: foundUser.username,
        points: foundUser.currencyPoints
    }

    return res.status(200).json(user);
}

const getTopUsersByPoints = async (req, res) => {

    const topNumberToSort = req.params.top;
    const users = [];

    if (!topNumberToSort) {
        return res.sendStatus(400);
    }

    try {
        const result = await User.find().sort({ currencyPoints: -1 }).limit(topNumberToSort);
        result.forEach(usr => users.push({ id: usr._id, username: usr.username, points: usr.currencyPoints }));
    } catch (err) {
        return res.status(500).json('Server error ', err);
    }

    return res.status(200).json(users);
}

const refreshToken = async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.jwt) {
        return res.sendStatus(401);
    }
    const refreshToken = cookie.jwt;
    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) {
        return res.sendStatus(403);
    }

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if (err || foundUser.username !== decoded.username) {
                return res.sendStatus(403);
            }
            const accessToken = jwt.sign(
                { username: decoded.username },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15s' }
            );
            res.json({ accessToken, username: foundUser.username });
        }
    )
}

module.exports = { registerNewUser, loginUser, deleteUser, refreshToken, logoutUser, getUserByUsername, getTopUsersByPoints }