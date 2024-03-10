const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.CONNECTION_STRING, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
    } catch (err) {
        console.log('Error while trying to connect to DB: ', err.message);
    }
}

module.exports = dbConnect 