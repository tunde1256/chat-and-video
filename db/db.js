const mongoose = require('mongoose');


const connection = mongoose.connect('mongodb+srv://ogunremitunde12:ogunremitunde12@cluster0.g3bnlww.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {

    
})
.then(() => console.log('MongoDB Connected...'))
.catch(err => console.error(err));

module.exports = connection