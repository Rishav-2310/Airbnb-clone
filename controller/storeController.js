const Home= require('../models/homes');
const mongoose= require('mongoose');
const User= require('../models/user');
const path= require('path');
const rootDir= require('../utils/pathUtil');

exports.getIndex= (req, res, next) => {
    console.log('Session value: ', req.session.isLoggedIn);
    // console.log('user: ', req.session.user);
    Home.find().then(registeredHomes => {
        res.render('store/index', {
            registeredHomes: registeredHomes, 
            pageTitle: 'airbnb Home', 
            currentPage: 'index',
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
        })
    });
}

exports.getHome= (req, res, next) => {
    Home.find().then(registeredHomes => {
        res.render('store/home-list', {
            registeredHomes: registeredHomes, 
            pageTitle: 'Homes List', 
            currentPage: 'home',
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
        })
    });
}

exports.getBookings= (req, res, next) => {
    res.render('store/bookings', {
        pageTitle: 'My Bookings', 
        currentPage: 'bookings',
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
    })
}

exports.getFavouriteList= async (req, res, next) => {
    const userId= req.session.user._id;
    const user= await User.findById(userId).populate('favourites');
    const favouriteHomes= user.favourites;
    res.render('store/favourite-list', {
        favouriteHomes: favouriteHomes, 
        pageTitle: 'My Favourites', 
        currentPage: 'favourite-list',
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
    })
};

exports.postAddToFavourite= async (req, res, next) => {
    const homeId= req.body.id;
    const userId= req.session.user._id;
    const user= await User.findById(userId);
    if(!user.favourites.includes(homeId)) {
        user.favourites.push(homeId);
        await user.save();
    }
    res.redirect('favourite-list');
}

exports.postDeleteFavourite= async (req, res, next) => {
    const homeId= req.params.homeId;
    const userId= req.session.user._id;
    const user= await User.findById(userId);
    if(user.favourites.includes(homeId)) {
        user.favourites= user.favourites.filter(fav => fav != homeId);
        await user.save();
    }
    res.redirect('/favourite-list');
}

exports.getHomeDetails= (req, res, next) => {
    const homeId= req.params.homeId;
    Home.findById(homeId).then(home => {
        if(!home){
            res.redirect("/homes");
        }
        else{
            res.render('store/home-detail', {
                home: home,
                pageTitle: 'Home Details',
                currentPage: 'home',
                isLoggedIn: req.isLoggedIn,
                user: req.session.user,
            });
        }
    })
}

exports.getHouseRules= [(req, res, next) => {
    if(!req.isLoggedIn) {
        return res.redirect('/login');
    }
    next();
},
(req, res, next) => {
    const homeId= req.params.homeId;
    Home.findById(homeId).then(home => {
        if (!home || !home.rules) {
            console.log("Home or rules not found");
            return res.redirect(`/homes/${homeId}`);
        }
        const filePath= path.join(rootDir, home.rules);
        res.download(filePath, `${home.houseName} Rules.pdf`, (err) => {
            if (err) {
                console.log("Error while downloading the file: ", err);
            }
        });
    }).catch(err => {
        console.log("Error finding home for rules download", err);
        res.redirect('/homes');
    });
}];