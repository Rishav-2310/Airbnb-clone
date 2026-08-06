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
    }],
    myHomes: [{  // Array of ObjectIds referencing the Home model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Home'
    }],
    bookings: [{
        home: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Home',
            required: true
        },
        checkIn: String,
        checkOut: String,
        guests: {
            adults: { type: Number, default: 1 },
            children: { type: Number, default: 0 },
            infants: { type: Number, default: 0 },
            pets: { type: Boolean, default: false }
        },
        totalNights: Number,
        totalPrice: Number,
        paymentMethod: String,
        specialRequests: String,
        addOns: [String],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    phone: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    occupation: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    languages: {
        type: String,
        default: ''
    },
    profilePic: {
        type: String,
        default: ''
    },
    profilePicBuffer: Buffer,
    profilePicMimeType: String,
    joinedDate: {
        type: Date,
        default: Date.now
    }
});


module.exports= mongoose.model('User', userSchema);