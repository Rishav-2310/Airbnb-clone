const { check, validationResult } = require("express-validator");
const bcrypt= require('bcryptjs');
const User= require('../models/user');

exports.getLogin= (req, res, next) => {
    res.render('auth/login', {
        pageTitle: 'Login Page', 
        currentPage: 'loginPage',
        isLoggedIn: false,
        errors: [],
        oldInput: {email: ''},
        user: {}
    })
}

exports.getSignUp= (req, res, next) => {
    res.render('auth/signup', {
        pageTitle: 'SignUp Page',
        currentPage: 'signUpPage',
        isLoggedIn: false,
        errors: [],
        oldInput: {firstName: '', lastName: '', email: '', userType: '', terms: ''},
        user: {}
    })
}

exports.postLogin= async (req, res, next) => {
    const {email, password}= req.body;
    const user= await User.findOne({email});
    if(!user) {
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            currentPage: 'login',
            isLoggedIn: false,
            errors: ['User does not exist'],
            oldInput: {email},
            user: {}
        })
    }

    const isMatch= await bcrypt.compare(password, user.password);
    if(!isMatch) {
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            currentPage: 'login',
            isLoggedIn: false,
            errors: ['Invalid password'],
            oldInput: {email},
            user: {}
        })
    }

    req.session.isLoggedIn= true;
    req.session.user= JSON.parse(JSON.stringify(user));
    req.session.save(err => {
        if (err) {
            console.log("Error occur while saving the session", err);
            return res.status(500).render('auth/login', {
                pageTitle: 'Login',
                currentPage: 'login',
                isLoggedIn: false,
                errors: ['An error occured while logging in, Please try again'],
                oldInput: {email},
                user: {}
            });
        }
        return res.redirect('/');
    });
}

exports.postSignUp= [
    check('firstName')
    .trim()
    .isLength({min: 2})
    .withMessage('First name should be atleast 2 characters long')
    .matches(/^[A-Za-z\s]+$/)
    .withMessage('First name should contain only alphabets'),

    check('lastName')
    .matches(/^[A-Za-z\s]*$/)
    .withMessage('Last name should contain only alphabets'),

    check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),

    check('password')
    .isLength({min: 8})
    .withMessage('Password should be atleast 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password should contain atleast one uppercase')
    .matches(/[a-z]/)
    .withMessage('Password should contain atleast one lowercase')
    .matches(/[0-9]/)
    .withMessage('Password should contain atleast one number')
    .matches(/[!@#$%^&*()_.,?\/|()<>:;]/)
    .withMessage('Password should contain atleast special character'),

    check('confirmPassword')
    .trim()
    .custom((value, {req}) => {
        if(value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),

    check('userType')
    .notEmpty()
    .withMessage('User Type is required')
    .isIn(['guest', 'host'])
    .withMessage('Invalid user type'),

    check('terms')
    .notEmpty()
    .custom((value, {req}) => {
        if(value !== 'on'){
            throw new Error('Please accept the terms and conditions');
        }
        return true;
    }),

    (req, res, next) => {
        const {firstName, lastName, email, password, userType}= req.body;
        const errors= validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).render('auth/signup', {
                pageTitle: 'SignUp',
                currentPage: 'signup',
                isLoggedIn: false,
                errors: errors.array().map(err => err.msg),
                oldInput: {firstName, lastName, email, userType, terms: req.body.terms},
                user: {}
            })
        }

        bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user= new User({firstName, lastName, email, password: hashedPassword, userType});
            return user.save();
        })
        .then(() => {
            res.redirect('/login');
        }).catch(err => {
            return res.status(422).render('auth/signup', {
            pageTitle: 'SignUp',
            currentPage: 'signup',
            isLoggedIn: false,
                errors: [err.message],
                oldInput: {firstName, lastName, email, userType, terms: req.body.terms},
                user: {}
            })
        })
    }
]

exports.postLogout= (req, res, next) => {
    req.session.destroy(() => {
        res.redirect('/login');
    })
}