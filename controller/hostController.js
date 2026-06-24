const Home= require('../models/homes');
const fs= require('fs');

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

exports.getHostHomes= (req, res, next) => {
    Home.find().then(registeredHomes => {
        res.render('host/host-home-list', {
            registeredHomes: registeredHomes, 
            pageTitle: 'Host Homes List', 
            currentPage: 'host-homes',
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
        })
    });
}

exports.postAddHome= (req, res, next) => {
    const {houseName, price, location, rating, description} = req.body;
    const photoFile = req.files && req.files['photo'] ? req.files['photo'][0] : null;
    const rulesFile = req.files && req.files['rules'] ? req.files['rules'][0] : null;
    if(!photoFile) {
        return res.status(400).send("No image Uploaded");
    }
    const home= new Home({houseName, price, location, rating, photo: photoFile.path, description, rules: rulesFile ? rulesFile.path : ''});
    home.save().then(() => {
        console.log("Home saved successfully");
    });
    res.redirect('/host/host-home-list');
}

exports.postEditHome= (req, res, next) => {
    const {id, houseName, price, location, rating, description} = req.body;
    const photoFile = req.files && req.files['photo'] ? req.files['photo'][0] : null;
    const rulesFile = req.files && req.files['rules'] ? req.files['rules'][0] : null;
    Home.findById(id).then((home) => {
        home.houseName= houseName;
        home.price= price;
        home.location= location;
        home.rating= rating;
        if(photoFile) {  // If user has uploaded a new image, then update the photo path...
            fs.unlink(home.photo, (err) => {
                if (err) {
                    console.log("Error while deleting old photo", err);
                }
            });
            home.photo= photoFile.path;
        }
        home.description= description;
        if(rulesFile) {  // If user has uploaded a new rules file, then update the rules path...
            fs.unlink(home.rules, (err) => {
                if (err) {
                    console.log("Error while deleting old rule files", err);
                }
            });
            home.rules= rulesFile.path;
        }
        home.save().then(result => {
            console.log("Home updated", result);
        }).catch(err => {
            console.log('Error while updating', err);
        })
        res.redirect('/host/host-home-list');
    }).catch(err => {
        console.log('Error while finding home', err);
    });
}

exports.postDeleteHome= (req, res, next) => {
    const homeId= req.params.homeId;
    Home.findByIdAndDelete(homeId).then(() => {
        res.redirect('/host/host-home-list');
    }).catch(err => {
        console.log("Error while Deleting ", err);
    })
}