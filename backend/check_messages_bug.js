require('dotenv').config();
const mongoose = require('mongoose');
const MentorMessage = require('./models/MentorMessage');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected DB');
    const msgs = await MentorMessage.find({ sender: 'mentor' }).sort({ createdAt: -1 }).limit(5);
    console.log('Mentor Messages:', msgs);
    process.exit(0);
  })
  .catch(console.error);
