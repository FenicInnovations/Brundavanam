const path = require("path");
const nodemailer = require("nodemailer");
const { frontendUrl } = require("../config/env");

const BRAND_NAME = "Brundavanam Goshala";
const BRAND_PRIMARY = "#c97a1f"; // Marigold
const BRAND_DARK = "#201b12";    // Aged Wood
const BRAND_BG = "#faf6ed";      // Warm Ivory
const BRAND_SUPPORT = "#3c5233"; // Tulsi Green

// Default company email requested by user (brundavanamgaushala@gmail.com)
const DEFAULT_COMPANY_EMAIL = "brundavanamgaushala@gmail.com";

let cachedTransporter = null;
let cachedPass = null;
let cachedUser = null;

/**
 * Creates and caches a Nodemailer transport using Gmail SMTP (100% Free, no subscription)
 * Dynamically reloads .env if credentials are newly added or updated
 */
function getTransporter() {
  // Ensure we read latest .env values if process.env.SMTP_PASS wasn't populated
  try {
    const dotenv = require("dotenv");
    dotenv.config({ path: path.resolve(__dirname, "../.env") });
  } catch {
    // Ignore dotenv reload failure
  }

  const user = (process.env.SMTP_USER || process.env.SUPPORT_EMAIL || DEFAULT_COMPANY_EMAIL).trim();
  const rawPass = (process.env.SMTP_PASS || "").trim();

  if (!rawPass) {
    console.warn("[emailService] SMTP_PASS is empty in backend/.env. Real emails cannot be dispatched.");
    cachedTransporter = null;
    return null;
  }

  const cleanPass = rawPass.replace(/\s+/g, "");

  // Reuse existing transporter if credentials haven't changed
  if (cachedTransporter && cachedPass === cleanPass && cachedUser === user) {
    return cachedTransporter;
  }

  try {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user,
        pass: cleanPass, // Strips any spaces from Google App Password
      },
      tls: {
        rejectUnauthorized: true,
      },
    });

    cachedPass = cleanPass;
    cachedUser = user;

    console.log(`[emailService] Gmail SMTP transport initialized for: ${user}`);
    return cachedTransporter;
  } catch (err) {
    console.error("[emailService] Failed to initialize Nodemailer transport:", err.message);
    cachedTransporter = null;
    return null;
  }
}

/**
 * Verifies Gmail SMTP connection and credentials
 */
async function verifySmtp() {
  const transport = getTransporter();
  const user = (process.env.SMTP_USER || process.env.SUPPORT_EMAIL || DEFAULT_COMPANY_EMAIL).trim();
  const rawPass = (process.env.SMTP_PASS || "").trim();

  if (!rawPass || !transport) {
    return {
      success: false,
      configured: false,
      user,
      message: "SMTP_PASS is not configured in backend/.env",
    };
  }

  try {
    await transport.verify();
    return {
      success: true,
      configured: true,
      user,
      message: `Gmail SMTP connected and verified successfully for ${user}!`,
    };
  } catch (err) {
    return {
      success: false,
      configured: true,
      user,
      error: err.message,
      message: `Gmail SMTP verification failed: ${err.message}`,
    };
  }
}

/**
 * Base email layout matching Brundavanam Goshala design identity
 */
function renderEmailShell({ title, preheader, content, actionUrl, actionText }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${BRAND_BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${BRAND_DARK}; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e7dcc4; box-shadow: 0 4px 16px rgba(32, 27, 18, 0.05); }
    .header { background: linear-gradient(135deg, #201b12 0%, #2e261a 100%); padding: 32px 36px; text-align: left; }
    .header-tag { display: inline-block; padding: 4px 10px; background-color: rgba(201, 122, 31, 0.2); border: 1px solid rgba(201, 122, 31, 0.4); border-radius: 20px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #f5b041; font-weight: 600; margin-bottom: 12px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 6px 0 0 0; color: #d0c8b6; font-size: 13px; }
    .body { padding: 36px; line-height: 1.6; }
    .greeting { font-size: 16px; font-weight: 600; color: ${BRAND_DARK}; margin-bottom: 16px; }
    .ticket-badge { display: inline-block; background-color: #f7ede2; color: #8c4a1f; border: 1px solid #ebd0b6; border-radius: 6px; padding: 6px 14px; font-family: monospace; font-size: 15px; font-weight: 700; margin: 12px 0; }
    .content-box { background-color: #fcfbf8; border: 1px solid #eee7db; border-radius: 8px; padding: 20px; margin: 20px 0; color: #40382b; font-size: 14px; }
    .btn { display: inline-block; background-color: ${BRAND_PRIMARY}; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 16px; text-align: center; }
    .btn:hover { background-color: #8c4a1f; }
    .footer { background-color: #fbf9f4; border-top: 1px solid #f0e9dc; padding: 24px 36px; font-size: 12px; color: #847a6b; line-height: 1.6; }
    .footer-links a { color: ${BRAND_PRIMARY}; text-decoration: none; margin-right: 12px; }
    .divider { height: 1px; background-color: #eee7db; margin: 24px 0; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="container">
    <div class="header">
      <div class="header-tag">Customer Support</div>
      <h1>${BRAND_NAME}</h1>
      <p>Direct from our indigenous goshala herd to your family</p>
    </div>
    <div class="body">
      ${content}
      ${
        actionUrl && actionText
          ? `<div style="text-align: center; margin: 28px 0 10px 0;">
              <a href="${actionUrl}" class="btn" target="_blank">${actionText} &rarr;</a>
            </div>`
          : ""
      }
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;"><strong>Brundavanam Goshala Customer Care</strong></p>
      <p style="margin: 0 0 12px 0;">Questions? Reply directly to this email or call/WhatsApp us at +91 94926 02499 (Mon–Sat, 9:30 AM – 6:00 PM IST).</p>
      <div class="footer-links">
        <a href="${frontendUrl}/contact">Support Desk</a>
        <a href="${frontendUrl}/shop">Storefront</a>
        <a href="${frontendUrl}/about">Our Mission</a>
      </div>
      <p style="margin: 16px 0 0 0; color: #a99f91; font-size: 11px;">
        &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatch an email via Gmail SMTP with fallback logging
 */
async function sendEmail({ to, subject, html, text, bcc }) {
  const companyEmail = (process.env.SMTP_USER || process.env.SUPPORT_EMAIL || DEFAULT_COMPANY_EMAIL).trim();

  const mailOptions = {
    from: `"${BRAND_NAME} Care" <${companyEmail}>`,
    to,
    bcc,
    replyTo: companyEmail,
    subject,
    text,
    html,
  };

  const transport = getTransporter();

  if (transport) {
    try {
      const info = await transport.sendMail(mailOptions);
      console.log(`\n[emailService] ==============================================`);
      console.log(`[emailService] LIVE EMAIL DELIVERED!`);
      console.log(`[emailService] To: ${to}`);
      console.log(`[emailService] From: ${mailOptions.from}`);
      if (bcc) console.log(`[emailService] BCC: ${bcc}`);
      console.log(`[emailService] Subject: "${subject}"`);
      console.log(`[emailService] MessageId: ${info.messageId}`);
      console.log(`[emailService] ==============================================\n`);
      return { success: true, messageId: info.messageId, live: true };
    } catch (err) {
      console.error(`\n[emailService] GMAIL SMTP ERROR sending to ${to}:`, err.message);
      if (
        err.message.includes("Username and Password not accepted") ||
        err.message.includes("Invalid login") ||
        err.message.includes("BadCredentials")
      ) {
        console.warn(`
[emailService] ==============================================================
[emailService] GMAIL APP PASSWORD ERROR:
[emailService] Google rejected the credentials for ${companyEmail}.
[emailService] 1. Go to: https://myaccount.google.com/apppasswords
[emailService] 2. Log in with ${companyEmail}
[emailService] 3. Create an App Name (e.g. "Brundavanam Support")
[emailService] 4. Copy the 16-character password into backend/.env:
[emailService]    SMTP_PASS=xxxx xxxx xxxx xxxx
[emailService] ==============================================================\n`);
      }
      return { success: false, error: err.message, live: false };
    }
  }

  // If no transport (SMTP_PASS not provided)
  console.warn(`\n[emailService] WARNING: Live email not sent to ${to}. SMTP_PASS is missing in backend/.env.`);
  console.log(`[emailService] EMAIL LOG (Simulation):`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Preview: ${text?.slice(0, 140) || "HTML"}...\n`);

  return {
    success: false,
    error: "SMTP_PASS is not configured in backend/.env. Real email could not be sent.",
    live: false,
    mockLogged: true,
  };
}

/**
 * 1. Customer Ticket Created Acknowledgment
 */
async function sendTicketCreatedEmail({ ticket, conversationUrl }) {
  const subject = `We've received your enquiry — #${ticket.ticketNumber}`;
  const actionUrl = conversationUrl || `${frontendUrl}/contact/track?ticket=${ticket.ticketNumber}`;

  const content = `
    <div class="greeting">Namaste ${ticket.name},</div>
    <p>Thank you for contacting <strong>${BRAND_NAME}</strong>. We have received your enquiry regarding <strong>"${ticket.subject}"</strong>.</p>
    <p>Your support ticket reference number is:</p>
    <div style="text-align: center;">
      <span class="ticket-badge">Reference: #${ticket.ticketNumber}</span>
    </div>
    <div class="content-box">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #847a6b; text-transform: uppercase; letter-spacing: 0.5px;">Your Message:</p>
      <p style="margin: 0; font-style: italic; white-space: pre-wrap;">${ticket.initialMessage || ticket.subject}</p>
    </div>
    <p>Our care team will review your enquiry and respond shortly. You can view updates or reply anytime by clicking the link below:</p>
  `;

  const html = renderEmailShell({
    title: subject,
    preheader: `Your support ticket #${ticket.ticketNumber} has been logged.`,
    content,
    actionUrl,
    actionText: "View Your Conversation",
  });

  return sendEmail({
    to: ticket.email,
    subject,
    html,
    text: `Namaste ${ticket.name},\n\nWe have received your enquiry #${ticket.ticketNumber}: "${ticket.subject}".\n\nView conversation: ${actionUrl}`,
  });
}

/**
 * 2. Admin Reply Notification to Customer
 */
async function sendAdminReplyEmail({ ticket, message, conversationUrl }) {
  const subject = `Update on Support Ticket #${ticket.ticketNumber} — ${ticket.subject}`;
  const actionUrl = conversationUrl || `${frontendUrl}/contact/track?ticket=${ticket.ticketNumber}`;
  const companyEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_COMPANY_EMAIL).trim();

  const content = `
    <div class="greeting">Hello ${ticket.name},</div>
    <p>Our support team has posted a response regarding your enquiry <strong>#${ticket.ticketNumber}</strong>:</p>
    <div class="content-box" style="border-left: 4px solid ${BRAND_PRIMARY}; background-color: #fffaf4;">
      <div style="font-size: 12px; font-weight: 600; color: #8c4a1f; margin-bottom: 6px;">
        ${message.senderName || "Support Representative"}:
      </div>
      <p style="margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${message.message}</p>
    </div>
    <p>You can reply directly to this email or click the button below to continue the conversation online:</p>
  `;

  const html = renderEmailShell({
    title: subject,
    preheader: `New reply from Brundavanam Goshala on ticket #${ticket.ticketNumber}`,
    content,
    actionUrl,
    actionText: "View & Reply to Conversation",
  });

  return sendEmail({
    to: ticket.email,
    bcc: companyEmail, // Company also receives a copy of outgoing response
    subject,
    html,
    text: `Hello ${ticket.name},\n\nOur team replied to your ticket #${ticket.ticketNumber}:\n\n${message.message}\n\nView and reply: ${actionUrl}`,
  });
}

/**
 * 3. Ticket Resolved Notification to Customer
 */
async function sendTicketResolvedEmail({ ticket, conversationUrl }) {
  const subject = `Your support request #${ticket.ticketNumber} has been resolved`;
  const actionUrl = conversationUrl || `${frontendUrl}/contact/track?ticket=${ticket.ticketNumber}`;

  const content = `
    <div class="greeting">Namaste ${ticket.name},</div>
    <p>Your support ticket <strong>#${ticket.ticketNumber}</strong> (<em>${ticket.subject}</em>) has now been marked as <strong style="color: ${BRAND_SUPPORT};">Resolved</strong>.</p>
    <p>If you have further questions or if your issue was not fully addressed, you can simply reply to reopen this conversation anytime.</p>
  `;

  const html = renderEmailShell({
    title: subject,
    preheader: `Ticket #${ticket.ticketNumber} marked resolved.`,
    content,
    actionUrl,
    actionText: "View Ticket Details",
  });

  return sendEmail({
    to: ticket.email,
    subject,
    html,
    text: `Namaste ${ticket.name},\n\nYour ticket #${ticket.ticketNumber} is marked resolved.\n\nView details: ${actionUrl}`,
  });
}

/**
 * 4. Ticket Reopened Notification
 */
async function sendTicketReopenedEmail({ ticket, conversationUrl }) {
  const subject = `Ticket #${ticket.ticketNumber} Reopened — ${BRAND_NAME}`;
  const actionUrl = conversationUrl || `${frontendUrl}/contact/track?ticket=${ticket.ticketNumber}`;

  const content = `
    <div class="greeting">Hello ${ticket.name},</div>
    <p>Your support ticket <strong>#${ticket.ticketNumber}</strong> has been reopened following your latest message.</p>
    <p>Our team has been notified and will review your update shortly.</p>
  `;

  const html = renderEmailShell({
    title: subject,
    preheader: `Support ticket #${ticket.ticketNumber} has been reopened.`,
    content,
    actionUrl,
    actionText: "View Open Conversation",
  });

  return sendEmail({
    to: ticket.email,
    subject,
    html,
    text: `Hello ${ticket.name},\n\nYour ticket #${ticket.ticketNumber} has been reopened.\n\nView ticket: ${actionUrl}`,
  });
}

/**
 * 5. Admin Notification on New Ticket or Customer Reply (Delivered to brundavanamgaushala@gmail.com)
 */
async function sendAdminNotificationEmail({ ticket, message, eventType }) {
  const adminEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_COMPANY_EMAIL).trim();
  const isReply = eventType === "customer_reply";
  const subject = isReply
    ? `[Customer Reply] Ticket #${ticket.ticketNumber}: ${ticket.subject}`
    : `[New Enquiry] Ticket #${ticket.ticketNumber}: ${ticket.subject} (${ticket.category})`;

  const adminUrl = `${frontendUrl}/admin/support/${ticket._id}`;

  const content = `
    <div class="greeting">New Support Activity</div>
    <p>${isReply ? `Customer <strong>${ticket.name}</strong> replied to existing ticket:` : `A new customer enquiry has been submitted:`}</p>
    <div class="content-box">
      <p style="margin: 0 0 6px 0;"><strong>Customer:</strong> ${ticket.name} (${ticket.email} | ${ticket.phone})</p>
      <p style="margin: 0 0 6px 0;"><strong>Ticket Number:</strong> #${ticket.ticketNumber}</p>
      <p style="margin: 0 0 6px 0;"><strong>Category:</strong> ${ticket.category}</p>
      <p style="margin: 0 0 10px 0;"><strong>Priority:</strong> ${ticket.priority.toUpperCase()}</p>
      <div class="divider" style="margin: 10px 0;"></div>
      <p style="margin: 0; font-style: italic; white-space: pre-wrap;">${message?.message || ticket.subject}</p>
    </div>
  `;

  const html = renderEmailShell({
    title: subject,
    preheader: `${isReply ? "Customer reply received" : "New support enquiry"} on #${ticket.ticketNumber}`,
    content,
    actionUrl: adminUrl,
    actionText: "Open Admin Workspace",
  });

  return sendEmail({
    to: adminEmail,
    subject,
    html,
    text: `${subject}\n\nCustomer: ${ticket.name} (${ticket.phone})\n\n${message?.message || ""}\n\nOpen admin workspace: ${adminUrl}`,
  });
}

/**
 * 6. Send live test verification email
 */
async function sendTestEmail({ to }) {
  const companyEmail = (process.env.SMTP_USER || process.env.SUPPORT_EMAIL || DEFAULT_COMPANY_EMAIL).trim();
  const subject = `[Test] Brundavanam Goshala Customer Care System Check`;

  const content = `
    <div class="greeting">Namaste!</div>
    <p>This is a live test email from the <strong>${BRAND_NAME}</strong> customer support system.</p>
    <div class="content-box">
      <p style="margin: 0 0 6px 0;"><strong>Sender:</strong> ${companyEmail}</p>
      <p style="margin: 0 0 6px 0;"><strong>Recipient:</strong> ${to}</p>
      <p style="margin: 0 0 6px 0;"><strong>Dispatched At:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
      <p style="margin: 0; color: #2e7d32; font-weight: 600;">&#10003; Gmail SMTP Active &amp; Operational (Free Tier)</p>
    </div>
    <p>Your support ticket creation alerts, customer replies, and status updates are now delivering properly via Gmail SMTP.</p>
  `;

  const html = renderEmailShell({
    title: subject,
    preheader: "Live test verification from Brundavanam Goshala",
    content,
    actionUrl: `${frontendUrl}/admin/support`,
    actionText: "Open Support Dashboard",
  });

  return sendEmail({
    to,
    subject,
    html,
    text: `Test email from Brundavanam Goshala support system sent to ${to} at ${new Date().toISOString()}. Gmail SMTP is working properly.`,
  });
}

/**
 * 7. Send Welcome Email upon Newsletter Subscription
 */
async function sendNewsletterWelcomeEmail({ email }) {
  const subject = `Welcome to Brundavanam Goshala - Sacred Wellness & Vedic Blessings`;

  const content = `
    <div class="greeting">Namaste! 🙏</div>
    <p>Warmest greetings from all of us and our beloved herd at <strong>${BRAND_NAME}</strong>.</p>
    <p>Thank you for subscribing to our community newsletter. You are now part of our sacred mission — honouring indigenous Gaumata, revitalising Vedic wellness traditions, and sharing pure, unadulterated Ayurvedic living.</p>
    <div class="content-box">
      <p style="margin: 0 0 8px 0; font-weight: 700; color: #8c4a1f;">🌟 What to Look Forward To in Your Inbox:</p>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Fresh batches of authentic <strong>Vedic Bilona A2 Desi Cow Ghee</strong></li>
        <li>Traditional herbal wisdom (Sahaja Kunkuma, Amrutha Dhara, Gau Dhara Oil)</li>
        <li>Stories and photo updates of mother cows and playful calves in our sanctuary</li>
        <li>Exclusive sacred festive discounts and priority devotee access</li>
      </ul>
    </div>
    <p>Every offering you bring into your home directly supports the lifetime care, organic fodder, and medicinal sanctuary for our protected indigenous cows.</p>
    <p>May mother Surabhi bless your home with health, peace, and abundance.</p>
  `;

  const html = renderEmailShell({
    title: subject,
    preheader: "Welcome to Brundavanam Goshala - Pure Vedic Ayurveda & Gaumata Seva",
    content,
    actionUrl: `${frontendUrl}/shop`,
    actionText: "Explore Sacred Offerings",
  });

  return sendEmail({
    to: email,
    subject,
    html,
    text: `Namaste! Welcome to Brundavanam Goshala. Thank you for subscribing to our newsletter. Explore our pure Ayurvedic offerings and goshala updates at ${frontendUrl}/shop`,
  });
}

/**
 * 8. Send Newsletter Broadcast Announcement to a subscriber
 */
async function sendNewsletterBroadcastEmail({ to, subject, message, actionUrl, actionText }) {
  const content = `
    <div class="greeting">Namaste Devotee! 🙏</div>
    <div style="font-size: 14px; line-height: 1.7; color: #3c3328;">
      ${message.replace(/\n/g, "<br/>")}
    </div>
    <div class="divider"></div>
    <p style="font-size: 12px; color: #7c7263; font-style: italic;">
      You received this update because you are subscribed to the Brundavanam Goshala newsletter.
    </p>
  `;

  const html = renderEmailShell({
    title: subject,
    preheader: subject,
    content,
    actionUrl: actionUrl || `${frontendUrl}/shop`,
    actionText: actionText || "Visit Brundavanam Goshala",
  });

  return sendEmail({
    to,
    subject,
    html,
    text: `${subject}\n\n${message}\n\nVisit: ${actionUrl || frontendUrl}`,
  });
}

module.exports = {
  verifySmtp,
  sendTestEmail,
  sendTicketCreatedEmail,
  sendAdminReplyEmail,
  sendTicketResolvedEmail,
  sendTicketReopenedEmail,
  sendAdminNotificationEmail,
  sendNewsletterWelcomeEmail,
  sendNewsletterBroadcastEmail,
};


