const mongoose = require('mongoose');


const connection = mongoose.connect('mongodb://localhost/myDatabase', {

    
})
.then(() => console.log('MongoDB Connected...'))
.catch(err => console.error(err));

module.exports = connection