const mongoose = require('mongoose');

const myHomesSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    home: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Home',
        required: true
    }
});

module.exports = mongoose.model('MyHomes', myHomesSchema);