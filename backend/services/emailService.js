const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Smart Campus Placement" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
  }
};

// ── Interview Scheduled ──────────────────────────────────────────────────────
const sendInterviewScheduledEmail = async (student, job, interview) => {
  const { scheduledDate, scheduledTime, mode, duration } = interview;
  const dateStr = new Date(scheduledDate).toDateString();
  const modeLabel = mode === 'online' ? '🌐 Online (Video Call)' : '🏢 In-Person';
  const meetingInfo = mode === 'online' && interview.interviewDetails?.meetingLink
    ? `<p><strong>Meeting Link:</strong> <a href="${interview.interviewDetails.meetingLink}" style="color:#6366f1;">${interview.interviewDetails.meetingLink}</a></p>`
    : '';

  const html = `
  <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#07071a;color:#e2e8f0;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 36px;">
      <h1 style="margin:0;color:white;font-size:24px;">📅 Interview Scheduled!</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Smart Campus Recruitment System · JSPM Hadapsar</p>
    </div>
    <div style="padding:32px 36px;">
      <p style="font-size:16px;">Hi <strong>${student.name}</strong>,</p>
      <p style="color:#94a3b8;">Great news! Your interview has been scheduled for the following position:</p>

      <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:20px 24px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:white;">💼 ${job.title}</p>
        <p style="margin:0;color:#a5b4fc;font-size:14px;">🏢 ${job.company}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#94a3b8;">
        <tr><td style="padding:8px 0;width:140px;">📆 Date</td><td style="color:white;font-weight:600;">${dateStr}</td></tr>
        <tr><td style="padding:8px 0;">⏰ Time</td><td style="color:white;font-weight:600;">${scheduledTime}</td></tr>
        <tr><td style="padding:8px 0;">⏱ Duration</td><td style="color:white;font-weight:600;">${duration} minutes</td></tr>
        <tr><td style="padding:8px 0;">📍 Mode</td><td style="color:white;font-weight:600;">${modeLabel}</td></tr>
      </table>
      ${meetingInfo}

      <div style="margin-top:28px;padding:16px 20px;background:rgba(245,158,11,0.08);border-left:3px solid #f59e0b;border-radius:8px;">
        <p style="margin:0;font-size:13px;color:#fbbf24;">💡 <strong>Tip:</strong> Review the job description, prepare common questions, and test your video setup (if online) before the interview.</p>
      </div>

      <p style="margin-top:28px;color:#475569;font-size:13px;">Login to your dashboard to view full details: <a href="${process.env.FRONTEND_URL}/login" style="color:#6366f1;">Smart Campus Portal</a></p>
    </div>
    <div style="padding:16px 36px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.05);font-size:12px;color:#334155;">
      © 2025 Smart Campus Recruitment System · JSPM Hadapsar, Pune
    </div>
  </div>`;

  await sendMail(student.email, `📅 Interview Scheduled – ${job.title} at ${job.company}`, html);
};

// ── Placement Congratulations ────────────────────────────────────────────────
const sendPlacementEmail = async (student, job) => {
  const html = `
  <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#07071a;color:#e2e8f0;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 36px;">
      <h1 style="margin:0;color:white;font-size:24px;">🎉 Congratulations! You're Placed!</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Smart Campus Recruitment System · JSPM Hadapsar</p>
    </div>
    <div style="padding:32px 36px;">
      <p style="font-size:16px;">Hi <strong>${student.name}</strong>,</p>
      <p style="color:#94a3b8;font-size:15px;line-height:1.7;">
        We are absolutely thrilled to tell you that you have been <strong style="color:#10b981;">SELECTED</strong> for the following position. 
        Your hard work, preparation, and performance during the interview process have truly paid off! 🏆
      </p>

      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 8px;font-size:22px;font-weight:900;color:white;">💼 ${job.title}</p>
        <p style="margin:0;color:#6ee7b7;font-size:16px;font-weight:600;">🏢 ${job.company}</p>
      </div>

      <p style="color:#94a3b8;font-size:14px;">The recruiter or placement officer will follow up with you regarding the offer letter, joining date, and next steps. Please keep an eye on your registered email.</p>

      <div style="margin-top:28px;padding:16px 20px;background:rgba(99,102,241,0.08);border-left:3px solid #6366f1;border-radius:8px;">
        <p style="margin:0;font-size:13px;color:#a5b4fc;">🎓 <strong>What's next?</strong> The placement team will contact you soon. Please update your profile to reflect your placed status and check the portal for updates.</p>
      </div>

      <p style="margin-top:28px;color:#475569;font-size:13px;">Login to your dashboard: <a href="${process.env.FRONTEND_URL}/login" style="color:#6366f1;">Smart Campus Portal</a></p>
    </div>
    <div style="padding:16px 36px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.05);font-size:12px;color:#334155;">
      © 2025 Smart Campus Recruitment System · JSPM Hadapsar, Pune
    </div>
  </div>`;

  await sendMail(student.email, `🎉 Congratulations! You've been placed at ${job.company}!`, html);
};

module.exports = { sendInterviewScheduledEmail, sendPlacementEmail };
