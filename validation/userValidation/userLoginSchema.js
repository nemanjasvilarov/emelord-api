const yup = require('yup');

const userLoginSchema = yup.object().shape({
    username: yup.string('Username must be a string').required('Username is required'),
    password: yup.string().min(8, 'Password must be at least 8 characters long.').required('Password is required.')
});

module.exports = userLoginSchema