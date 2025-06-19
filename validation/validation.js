import { check } from 'express-validator';

export const registeredvalidator = [
    check('name', 'Name is required').not().isEmpty(),
    check('name', 'Name must be of 3 to 20 letters')
        .isLength({ min: 3, max: 15 }),
    
    check('email', 'Email is required')
        .isEmail()
        .withMessage('Invalid Email Format')
        .isLength({ min: 12, max: 25 })
        .withMessage('Email must be between 8 to 25 letters')
        .normalizeEmail({ gmail_remove_dots: true }),
    
    check('mobile', 'mobile number must be of 10 digits').isLength({
        min: 10,
        max: 10
    }),
    check('pass', 'password must be greater than 8,contains lower and upper case and special character').isStrongPassword({
        minLength: 8,
        minUppercase: 1, minLowercase: 1,
        minNumbers: 1,
        minSymbols:1
    })

]