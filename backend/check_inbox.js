const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const MentorMessage = require('./models/MentorMessage');
const Mentor = require('./models/Mentor');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    
    const mentorId = "69c680444cd8916a6ac08ed6";
    const messages = await MentorMessage.find({ mentorId })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    const convMap = {};
    messages.forEach(msg => {
      const sId = msg.studentId?._id?.toString();
      if (!sId) return;
      if (!convMap[sId]) {
        convMap[sId] = {
          studentId:   sId,
          studentName: msg.studentId?.name || 'Unknown Student',
          studentEmail: msg.studentId?.email || '',
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unread: 0
        };
      }
      if (msg.sender === 'student' && !msg.isRead) convMap[sId].unread++;
    });

    fs.writeFileSync('inbox_out.json', JSON.stringify(Object.values(convMap), null, 2), 'utf8');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
