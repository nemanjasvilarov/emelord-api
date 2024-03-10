require('dotenv').config();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const express = require('express');
const app = express();

//Connect to MongoDB
connectDB();

const corsConfig = {
    origin: true,
    credentials: true,
};

app.use(cors(corsConfig));

app.options('*', cors(corsConfig))

app.use(express.urlencoded({ extended: false }))

app.use(express.json());

app.use(cookieParser());

app.use('/users', require('./routes/users'));

app.use('/posts', require('./routes/posts'));

const PORT = process.env.PORT || 3500;

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log('Server started on port ', PORT);
    });
})