const mongoose= require('mongoose');

const userSchema= mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Fisrt name is required']
    },
    lastName: String,
    email: {
        type: String,
        required: [true, 'Email is required']
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    userType: {
        type: String,
        enum: ['guest', 'host'],
        default: 'guest'
    },
    favourites: [{  // Array of ObjectIds referencing the Home model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Home'
    }]
});

module.exports= mongoose.model('User', userSchema);