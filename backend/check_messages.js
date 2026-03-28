const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const MentorMessage = require('./models/MentorMessage');
const Mentor = require('./models/Mentor');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    
    const mentors = await Mentor.find({}, '-__v').lean();
    const messages = await MentorMessage.find().sort({ createdAt: -1 }).limit(10).lean();
    
    fs.writeFileSync('db_out.json', JSON.stringify({mentors, messages}, null, 2), 'utf8');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
