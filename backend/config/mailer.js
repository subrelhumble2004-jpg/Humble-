const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function sendAppointmentConfirmation({ to, name, queueNumber, doctorName, department, date, time }) {
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0F4C81,#16A34A);padding:28px;color:#fff">
      <p style="margin:0;font-size:12px;letter-spacing:.08em;opacity:.85">MEDQUEUE PRO</p>
      <h2 style="margin:6px 0 0;font-size:22px">Appointment Confirmed</h2>
    </div>
    <div style="padding:24px;color:#0f172a">
      <p>Hi ${name},</p>
      <p>Your appointment has been booked successfully. Here are your details:</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px">
        <tr><td style="padding:6px 0;color:#64748b">Queue Number</td><td style="padding:6px 0;font-weight:700">${queueNumber}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Doctor</td><td style="padding:6px 0">${doctorName}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Department</td><td style="padding:6px 0">${department}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Date &amp; Time</td><td style="padding:6px 0">${date} · ${time}</td></tr>
      </table>
      <p style="margin-top:18px;font-size:13px;color:#64748b">Please arrive 15 minutes early. Show this queue number at reception for instant check-in.</p>
    </div>
  </div>`;

  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `MedQueue Pro — Appointment Confirmed (${queueNumber})`,
    html,
  });
}

async function sendPasswordResetEmail({ to, resetLink }) {
  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "MedQueue Pro — Reset your password",
    html: `<p>Click the link below to reset your password. This link expires in 30 minutes.</p>
           <p><a href="${resetLink}">${resetLink}</a></p>`,
  });
}

module.exports = { transporter, sendAppointmentConfirmation, sendPasswordResetEmail };
