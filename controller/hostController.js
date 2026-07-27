const Home= require('../models/homes');
const User= require('../models/user');

const fs= require('fs');

const randomString= (length) => {
    const characters= '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result= '';
    for(let i=0; i<length; i++){
        result+= characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

exports.getAddHome= (req, res, next) => {
    res.render('host/edit-home', {
        pageTitle: 'Add home to airbnb', 
        currentPage: 'addHome',
        editing: false,
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
    });
};

exports.getEditHome= (req, res, next) => {
    const homeId= req.params.homeId;
    const editing= req.query.editing;
    Home.findById(homeId).then(home => {
        if(!home){
            console.log("Home not found for editing");
            return res.redirect('/host/host-home-list');
        }
        console.log(homeId, editing, home);
        res.render('host/edit-home', {
            home: home,
            pageTitle: 'Edit Your Home', 
            currentPage: 'host-homes',
            editing: editing,
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
        });
    })
};

exports.getHostHomes = async (req, res, next) => {
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId).populate('myHomes');
        const hostHomes = user ? user.myHomes : [];
        res.render('host/host-home-list', {
            registeredHomes: hostHomes, 
            pageTitle: 'My Homes',  
            currentPage: 'host-homes',
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
        });
    } catch (err) {
        console.log("Error fetching host homes", err);
        res.redirect('/');
    }
}

exports.postAddHome = async (req, res, next) => {
    try {
        const {houseName, price, location, rating, description} = req.body;
        const photoFile = req.files && req.files['photo'] ? req.files['photo'][0] : null;
        const rulesFile = req.files && req.files['rules'] ? req.files['rules'][0] : null;
        if(!photoFile) {
            return res.status(400).send("No image Uploaded");
        }
        const photoName = randomString(10) + '-' + photoFile.originalname;
        const normalizedPhotoPath = 'uploads/' + photoName;
        
        let normalizedRulesPath = '';
        let rulesBuffer = null;
        let rulesMimeType = '';
        if (rulesFile) {
            const rulesName = `rules-${randomString(10)}.pdf`;
            normalizedRulesPath = 'rules/' + rulesName;
            rulesBuffer = rulesFile.buffer;
            rulesMimeType = rulesFile.mimetype;
        }

    const home = new Home({
            houseName,
            price,
            location,
            rating,
            photo: normalizedPhotoPath,
            photoBuffer: photoFile.buffer,
            photoMimeType: photoFile.mimetype,
            description,
            rules: normalizedRulesPath,
            rulesBuffer,
            rulesMimeType
        });
        const savedHome = await home.save();
        console.log("Home saved successfully");
    if (req.session.user && req.session.user._id) {
            const user = await User.findById(req.session.user._id);
            if (user) {
                if (!user.myHomes.includes(savedHome._id)) {
                    user.myHomes.push(savedHome._id);
                    await user.save();
                }
            }
        }
        res.redirect('/host/host-home-list');
    } catch (err) {
        console.log("Error saving home", err);
    res.redirect('/host/host-home-list');
    }
}

exports.postEditHome= (req, res, next) => {
    const {id, houseName, price, location, rating, description} = req.body;
    const photoFile = req.files && req.files['photo'] ? req.files['photo'][0] : null;
    const rulesFile = req.files && req.files['rules'] ? req.files['rules'][0] : null;
    Home.findById(id).then((home) => {
        // home.houseName= houseName;
        // home.price= price;
        // home.location= location;
        // home.rating= rating;
        // if(photoFile) {  // If user has uploaded a new image, then update the photo path...
        if (!home) {
            console.log("Home not found for editing");
            return res.redirect('/host/host-home-list');
        }
        home.houseName = houseName;
        home.price = price;
        home.location = location;
        home.rating = rating;
        home.description = description;

        if (photoFile) {
            if (home.photo && fs.existsSync(home.photo)) {
                fs.unlink(home.photo, (err) => {
                    if (err) {
                        console.log("Error while deleting old photo", err);
                    }
                });
            // home.photo= photoFile.path;
        //     home.photo= photoFile.path.replace(/\\/g, '/');
        // }
        // home.description= description;
        // if(rulesFile) {  // If user has uploaded a new rules file, then update the rules path...
            }
            const photoName = randomString(10) + '-' + photoFile.originalname;
            home.photo = 'uploads/' + photoName;
            home.photoBuffer = photoFile.buffer;
            home.photoMimeType = photoFile.mimetype;
        }

        if (rulesFile) {
            if (home.rules && fs.existsSync(home.rules)) {
                fs.unlink(home.rules, (err) => {
                    if (err) {
                        console.log("Error while deleting old rule files", err);
                    }
                });
            // home.rules= rulesFile.path;
            // home.rules= rulesFile.path.replace(/\\/g, '/');
            }
            const rulesName = `rules-${randomString(10)}.pdf`;
            home.rules = 'rules/' + rulesName;
            home.rulesBuffer = rulesFile.buffer;
            home.rulesMimeType = rulesFile.mimetype;
        }
        home.save().then(result => {
            console.log("Home updated", result);
        }).catch(err => {
            console.log('Error while updating', err);
        });
        res.redirect('/host/host-home-list');
    }).catch(err => {
        console.log('Error while finding home', err);
        res.redirect('/host/host-home-list');
    });
}

exports.postDeleteHome = async (req, res, next) => {
    try {
        const homeId = req.params.homeId;
        await Home.findByIdAndDelete(homeId);
        await User.updateMany(
            {},
            { $pull: { favourites: homeId, myHomes: homeId } }
        );
        res.redirect('/host/host-home-list');
    } catch (err) {
        console.log("Error while Deleting ", err);
    res.redirect('/host/host-home-list');
    }
}