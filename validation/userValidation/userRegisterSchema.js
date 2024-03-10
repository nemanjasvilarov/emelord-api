const yup = require('yup');

const userRegisterSchema = yup.object().shape({
    firstName: yup.string('First name must only contain letters.').required('First name is required.').matches(/^[A-Z][a-z]{2,23}$/, 'First name can\t contain numbers'),
    lastName: yup.string('Last name must only contain letters.').required('Last name is required.').matches(/^[A-Z][a-z]{2,23}$/, 'Last name can\t contain numbers'),
    username: yup.string('Username must be a string').required('Username is required'),
    email: yup.string().email('Email must be valid.').required('Email is required.'),
    password: yup.string().min(8, 'Password must be at least 8 characters long.').required('Password is required.')
});

module.exports = userRegisterSchema