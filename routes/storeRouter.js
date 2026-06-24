const express= require('express');
const storeRouter= express.Router();

// const rootDir= require('../utils/pathUtil');
const storeController= require('../controller/storeController');

storeRouter.get('/', storeController.getIndex);
storeRouter.get('/homes', storeController.getHome);
storeRouter.get('/bookings', storeController.getBookings);
storeRouter.get('/favourite-list', storeController.getFavouriteList);
storeRouter.get('/homes/:homeId', storeController.getHomeDetails);
storeRouter.post('/favourite-list', storeController.postAddToFavourite);
storeRouter.post('/homes/delete-favourite/:homeId', storeController.postDeleteFavourite);
storeRouter.get('/rules/:homeId', storeController.getHouseRules);

module.exports= storeRouter;