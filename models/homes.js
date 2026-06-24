const mongoose= require('mongoose');

const homeSchema= mongoose.Schema({
    houseName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    photo: String,
    description: String,
    rules: String,
});

// This is used to delete favourites while deleting homes...
// homeSchema.pre('findOneAndDelete', async function() {
//     const homeId= this.getQuery()._id;
//     await favourite.deleteMany({homeId: homeId});
// })

module.exports= mongoose.model('Home', homeSchema);