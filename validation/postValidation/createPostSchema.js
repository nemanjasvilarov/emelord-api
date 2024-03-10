import * as yup from 'yup';

export const postSchema = yup.object().shape({
    image: yup.required('Image is required'),
});