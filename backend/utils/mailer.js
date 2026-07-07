import nodemailer from "nodemailer";

const emailHtml = (intro, link, buttonText) => `
  <div style="background:#0e1116;padding:40px 0;font-family:'Segoe UI',Arial,sans-serif">
    <div style="max-width:460px;margin:0 auto;background:#161b24;border:1px solid #262e3b;border-radius:16px;padding:32px;color:#c9d1dc">
      <h1 style="margin:0 0 8px;font-size:24px;color:#c9d1dc">
        type<span style="color:#e2b714">ify</span>
      </h1>
      <p style="color:#6b7688;margin:0 0 24px;font-size:14px">${intro}</p>
      <div style="background:#1d2430;border:1px solid #262e3b;border-radius:12px;text-align:center;padding:20px;margin-bottom:24px">
        <a href="${link}" style="display:inline-block;padding:12px 24px;background-color:#e2b714;color:#0e1116;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">${buttonText}</a>
      </div>
      <p style="color:#6b7688;font-size:13px;margin:0">This link expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
    </div>
  </div>`;

const send = async ({ to, subject, intro, link, buttonText }) => {
  const { BREVO_SMTP_HOST, BREVO_SMTP_PORT, BREVO_SMTP_USER, BREVO_SMTP_PASS, EMAIL_FROM_NAME, EMAIL_FROM } = process.env;
  
  if (!BREVO_SMTP_HOST || !BREVO_SMTP_USER) {
    throw new Error(
      "Email is not configured. Set BREVO_SMTP_ variables in backend/.env",
    );
  }

  const transporter = nodemailer.createTransport({
    host: BREVO_SMTP_HOST,
    port: Number(BREVO_SMTP_PORT) || 587,
    secure: Number(BREVO_SMTP_PORT) === 465, // true for 465, false for 587
    connectionTimeout: 10000, // fail after 10 seconds instead of hanging forever
    auth: {
      user: BREVO_SMTP_USER,
      pass: BREVO_SMTP_PASS,
    },
  });

  const mail = {
    from: `"${EMAIL_FROM_NAME || "Typeify"}" <${EMAIL_FROM || "noreply@typeify.com"}>`,
    to,
    subject,
    text: `${intro.replace(/<[^>]*>/g, "")} Link: ${link}. It expires in 10 minutes.`,
    html: emailHtml(intro, link, buttonText),
  };

  try {
    const info = await transporter.sendMail(mail);
    console.log("Email sent! Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Email service failed:", error);
    throw error;
  }
};

export const sendVerificationEmail = (to, token) => {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;
  return send({
    to,
    link,
    buttonText: "Verify Email",
    subject: "Verify your Typeify email",
    intro: "Welcome to Typeify! Verify your email to finish signing up.",
  });
};

export const sendPasswordResetEmail = (to, token) => {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
  return send({
    to,
    link,
    buttonText: "Reset Password",
    subject: "Your Typeify password reset link",
    intro: "Use this link to reset your Typeify password.",
  });
};
