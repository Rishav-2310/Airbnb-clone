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

exports.getBookings = async (req, res, next) => {
    if (!req.isLoggedIn) {
        return res.redirect('/login');
    }
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId).populate('bookings.home');
        const bookings = user && user.bookings ? user.bookings : [];
        res.render('store/bookings', {
            bookings: bookings,
            pageTitle: 'My Bookings', 
            currentPage: 'bookings',
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
        });
    } catch (err) {
        console.log("Error fetching bookings", err);
        res.render('store/bookings', {
            bookings: [],
            pageTitle: 'My Bookings', 
            currentPage: 'bookings',
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
        });
    }
}

exports.getFavouriteList= async (req, res, next) => {
    if (!req.isLoggedIn || (req.session.user && req.session.user.userType !== 'guest')) {
        return res.redirect('/');
    }
    const userId= req.session.user._id;
    const user= await User.findById(userId).populate('favourites');
    const favouriteHomes= user ? user.favourites : [];
    res.render('store/favourite-list', {
        favouriteHomes: favouriteHomes, 
        pageTitle: 'My Favourites', 
        currentPage: 'favourite-list',
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
    })
};

exports.postAddToFavourite= async (req, res, next) => {
    if (!req.isLoggedIn || (req.session.user && req.session.user.userType !== 'guest')) {
        return res.redirect('/');
    }
    const homeId= req.body.id;
    const userId= req.session.user._id;
    const user= await User.findById(userId);
    if(user && !user.favourites.includes(homeId)) {
        user.favourites.push(homeId);
        await user.save();
    }
    res.redirect('/favourite-list');
}

exports.postDeleteFavourite= async (req, res, next) => {
    if (!req.isLoggedIn || (req.session.user && req.session.user.userType !== 'guest')) {
        return res.redirect('/');
    }
    const homeId= req.params.homeId;
    const userId= req.session.user._id;
    const user= await User.findById(userId);
    if(user && user.favourites.includes(homeId)) {
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
        // if (!home || !home.rules) {
        if (!home) {
            console.log("Home not found");
            return res.redirect('/homes');
        }
        
        // If rules buffer exists in DB, serve/download from buffer
        if (home.rulesBuffer) {
            res.setHeader('Content-Type', home.rulesMimeType || 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${home.houseName} Rules.pdf"`);
            return res.send(home.rulesBuffer);
        }
        
        // Otherwise, fall back to local disk files
        if (!home.rules) {
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

exports.getReserve= (req, res, next) => {
    if(!req.isLoggedIn) {
        return res.redirect('/login');
    }
    const homeId= req.params.homeId;
    Home.findById(homeId).then(home => {
        if(!home) {
            res.redirect("/homes");
            return;
        }
        else {
            res.render('store/reserve', {
                home: home,
                pageTitle: 'Reserve Home',
                currentPage: 'reserve',
                isLoggedIn: req.isLoggedIn,
                user: req.session.user,
            })
        }
    })
};

exports.postReserve = async (req, res, next) => {
    if (!req.isLoggedIn) {
        return res.redirect('/login');
    }
    const homeId = req.params.homeId;
    const {
        checkIn,
        checkOut,
        adults,
        children,
        infants,
        pets,
        totalNights,
        totalPrice,
        paymentMethod,
        specialRequests,
        addOns
    } = req.body;

    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/login');
        }

        const parsedAddOns = Array.isArray(addOns) ? addOns : (addOns ? [addOns] : []);

        user.bookings.push({
            home: homeId,
            checkIn: checkIn || new Date().toISOString().split('T')[0],
            checkOut: checkOut || new Date().toISOString().split('T')[0],
            guests: {
                adults: parseInt(adults) || 1,
                children: parseInt(children) || 0,
                infants: parseInt(infants) || 0,
                pets: pets === 'on' || pets === 'true' || pets === true
            },
            totalNights: parseInt(totalNights) || 1,
            totalPrice: parseFloat(totalPrice) || 0,
            paymentMethod: paymentMethod || 'Card',
            specialRequests: specialRequests || '',
            addOns: parsedAddOns
        });

        await user.save();
        res.redirect('/bookings');
    } catch (err) {
        console.log("Error completing reservation", err);
        res.redirect('/homes/' + homeId);
    }
};

exports.postCancelBooking = async (req, res, next) => {
    if (!req.isLoggedIn) {
        return res.redirect('/login');
    }
    try {
        const bookingId = req.params.bookingId;
        const userId = req.session.user._id;
        const user = await User.findById(userId);
        if (user) {
            user.bookings = user.bookings.filter(b => b._id.toString() !== bookingId);
            await user.save();
        }
        res.redirect('/bookings');
    } catch (err) {
        console.log("Error cancelling booking", err);
        res.redirect('/bookings');
    }
};