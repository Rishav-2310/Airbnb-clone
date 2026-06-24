const path= require('path');
const express= require('express');
const bodyParser= require('body-parser');
const multer= require('multer');
const session= require('express-session');
const MongoDBStore= require('connect-mongodb-session')(session);
require('dotenv').config();
const DB_PATH= process.env.DB_PATH;

const storeRouter= require('./routes/storeRouter');
const hostRouter= require('./routes/hostRouter');
const authRouter= require('./routes/authRouter');
const rootDir= require('./utils/pathUtil');     // From this we can use this name 'rootDir' instead of '__dirname'...
const errorsController= require('./controller/errors');
const {default: mongoose} = require('mongoose');

const app= express();

app.set('view engine', 'ejs');  // For using ejs...
app.set('views', 'views');  // views is name after the folder views if we change that name we aslo have to change the name in this...

const store= new MongoDBStore({
    uri: DB_PATH,
    collection: 'sessions'
})

const randomString= (length) => {
    const characters= '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result= '';
    for(let i=0; i<length; i++){
        result+= characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const uploadStorage= multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'rules') {
            cb(null, 'rules/');
        } else {
            cb(null, 'uploads/');
        }
    },
    filename: (req, file, cb) => {
        if (file.fieldname === 'rules') {
            cb(null, `rules-${randomString(10)}.pdf`);
        } else {
            cb(null, randomString(10) + '-' + file.originalname);
        }
    }
});

const uploadFileFilter = (req, file, cb) => {
    if (file.fieldname === 'photo') {
        if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(null, false);
        }
    } else if (file.fieldname === 'rules') {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(null, false);
        }
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: uploadStorage,
    fileFilter: uploadFileFilter
}).fields([
    { name: 'photo', maxCount: 1 },
    { name: 'rules', maxCount: 1 }
]);

app.use(express.urlencoded({extended: true}));  // It helps to read input data...
app.use(upload);  // It helps to read photo and rules data...
app.use(express.static(path.join(rootDir, 'public')));  // It helps to use css file and make folder public...
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));  // It helps to use uploaded images and make folder public...
app.use('/host/uploads', express.static(path.join(rootDir, 'uploads')));
app.use('/homes/uploads', express.static(path.join(rootDir, 'uploads')));
app.use(session({
    secret: "Code with Rishav Singh",
    resave: false,
    saveUninitialized: true,
    store: store
}))
app.use((req, res, next) => {
    // req.isLoggedIn= req.get('Cookie') ? req.get('Cookie').split('=')[1] === 'true' : false; // To read the cookie and check if the user is logged in to show him all the allowed logged in things...
    req.isLoggedIn= req.session.isLoggedIn;
    next();
})
app.use(storeRouter);
app.use(authRouter);
app.use('/host', (req, res, next) => {  // Allows not to access direct through the path in searchbox
    if(!req.isLoggedIn){
        return res.redirect('/login');
    }
    // else{
    //     next();
    // }
    if(req.session.user && req.session.user.userType !== 'host') {
        return res.redirect('/');
    }
    next();
});
app.use('/host',hostRouter);   // adding /host path add /host on links like /host/add-home...
app.use(errorsController.page404) // 404 Page...

const PORT= 3001;

mongoose.connect(DB_PATH).then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on address http://localhost:${PORT}`);
    });
})
.catch(err => {
        console.log("Error while connecting to Mongo", err);
});
