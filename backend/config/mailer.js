const nodemailer = require("nodemailer");
require("dotenv").config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

/*
|--------------------------------------------------------------------------
| SMTP Configuration
|--------------------------------------------------------------------------
| The transporter is created only when SMTP credentials are configured.
| This allows the backend to run normally when email has not been configured.
|--------------------------------------------------------------------------
*/

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
} else {
  console.warn(
    "⚠️ SMTP is not configured. Email notifications are disabled."
  );
}

/*
|--------------------------------------------------------------------------
| Verify SMTP Connection
|--------------------------------------------------------------------------
*/

async function verifyMailer() {
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    console.log("✅ Email service connected successfully.");
    return true;
  } catch (error) {
    console.error(
      "❌ Email service connection failed:",
      error.message
    );

    return false;
  }
}

/*
|--------------------------------------------------------------------------
| Escape HTML
|--------------------------------------------------------------------------
| Prevents user-provided values from being inserted directly into HTML.
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/*
|--------------------------------------------------------------------------
| Send Appointment Confirmation
|--------------------------------------------------------------------------
*/

async function sendAppointmentConfirmation({
  to,
  name,
  queueNumber,
  doctorName,
  department,
  date,
  time
}) {
  if (!transporter) {
    console.warn(
      "⚠️ Appointment confirmation email skipped: SMTP is not configured."
    );

    return {
      skipped: true,
      reason: "SMTP is not configured"
    };
  }

  const safeName = escapeHtml(name);
  const safeQueueNumber = escapeHtml(queueNumber);
  const safeDoctorName = escapeHtml(doctorName);
  const safeDepartment = escapeHtml(department);
  const safeDate = escapeHtml(date);
  const safeTime = escapeHtml(time);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MedQueue Pro Appointment Confirmation</title>
      </head>

      <body style="
        margin:0;
        padding:24px;
        background:#f8fafc;
        font-family:Arial,Helvetica,sans-serif;
        color:#0f172a;
      ">

        <div style="
          max-width:520px;
          margin:0 auto;
          background:#ffffff;
          border:1px solid #e2e8f0;
          border-radius:16px;
          overflow:hidden;
        ">

          <div style="
            background:linear-gradient(135deg,#0F4C81,#16A34A);
            padding:28px;
            color:#ffffff;
          ">
            <p style="
              margin:0;
              font-size:12px;
              letter-spacing:1px;
              opacity:.85;
            ">
              MEDQUEUE PRO
            </p>

            <h2 style="
              margin:6px 0 0;
              font-size:22px;
            ">
              Appointment Confirmed
            </h2>
          </div>

          <div style="padding:24px;">

            <p>
              Hi ${safeName},
            </p>

            <p>
              Your MedQueue Pro appointment has been booked successfully.
              Here are your appointment details:
            </p>

            <table style="
              width:100%;
              border-collapse:collapse;
              margin-top:18px;
              font-size:14px;
            ">

              <tr>
                <td style="
                  padding:8px 0;
                  color:#64748b;
                ">
                  Queue Number
                </td>

                <td style="
                  padding:8px 0;
                  font-weight:bold;
                ">
                  ${safeQueueNumber}
                </td>
              </tr>

              <tr>
                <td style="
                  padding:8px 0;
                  color:#64748b;
                ">
                  Doctor
                </td>

                <td style="padding:8px 0;">
                  ${safeDoctorName}
                </td>
              </tr>

              <tr>
                <td style="
                  padding:8px 0;
                  color:#64748b;
                ">
                  Department
                </td>

                <td style="padding:8px 0;">
                  ${safeDepartment}
                </td>
              </tr>

              <tr>
                <td style="
                  padding:8px 0;
                  color:#64748b;
                ">
                  Date
                </td>

                <td style="padding:8px 0;">
                  ${safeDate}
                </td>
              </tr>

              <tr>
                <td style="
                  padding:8px 0;
                  color:#64748b;
                ">
                  Time
                </td>

                <td style="padding:8px 0;">
                  ${safeTime}
                </td>
              </tr>

            </table>

            <div style="
              margin-top:20px;
              padding:14px;
              background:#f1f5f9;
              border-radius:10px;
            ">
              <p style="
                margin:0;
                font-size:13px;
                color:#475569;
              ">
                Please arrive approximately 15 minutes early and present
                your queue number at reception.
              </p>
            </div>

            <p style="
              margin-top:24px;
              font-size:13px;
              color:#64748b;
            ">
              Thank you for using MedQueue Pro.
            </p>

          </div>
        </div>

      </body>
    </html>
  `;

  return transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: `MedQueue Pro — Appointment Confirmed (${safeQueueNumber})`,
    html
  });
}

/*
|--------------------------------------------------------------------------
| Send Password Reset Email
|--------------------------------------------------------------------------
*/

async function sendPasswordResetEmail({
  to,
  resetLink
}) {
  if (!transporter) {
    console.warn(
      "⚠️ Password reset email skipped: SMTP is not configured."
    );

    return {
      skipped: true,
      reason: "SMTP is not configured"
    };
  }

  const safeResetLink = escapeHtml(resetLink);

  return transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: "MedQueue Pro — Reset your password",

    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password</title>
        </head>

        <body style="
          margin:0;
          padding:24px;
          background:#f8fafc;
          font-family:Arial,Helvetica,sans-serif;
          color:#0f172a;
        ">

          <div style="
            max-width:520px;
            margin:0 auto;
            background:#ffffff;
            border:1px solid #e2e8f0;
            border-radius:16px;
            padding:28px;
          ">

            <h2 style="margin-top:0;">
              Reset your MedQueue Pro password
            </h2>

            <p>
              We received a request to reset your password.
            </p>

            <p>
              Click the button below to continue:
            </p>

            <p style="margin:24px 0;">
              <a
                href="${safeResetLink}"
                style="
                  display:inline-block;
                  padding:12px 20px;
                  background:#0F4C81;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:8px;
                  font-weight:bold;
                "
              >
                Reset Password
              </a>
            </p>

            <p style="
              font-size:13px;
              color:#64748b;
            ">
              This password-reset link expires in 30 minutes.
            </p>

            <p style="
              font-size:12px;
              color:#94a3b8;
              word-break:break-all;
            ">
              If the button does not work, use this link:
              ${safeResetLink}
            </p>

          </div>

        </body>
      </html>
    `
  });
}

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  transporter,
  verifyMailer,
  sendAppointmentConfirmation,
  sendPasswordResetEmail
};
