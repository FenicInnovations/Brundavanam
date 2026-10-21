const { frontendUrl, company } = require("../config/env");
const emailService = require("./emailService");

const BRAND_NAME = company?.name || "Brundavanam Goshala";
const BRAND_PRIMARY = "#c97a1f"; // Marigold
const BRAND_DARK = "#201b12";    // Aged Wood
const BRAND_BG = "#faf6ed";      // Warm Ivory

/**
 * Reusable HTML layout shell for Order notifications
 */
function renderOrderEmailShell({ title, preheader, content, actionUrl, actionText }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${BRAND_BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${BRAND_DARK}; }
    .wrapper { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e7dfcf; }
    .header { background: ${BRAND_PRIMARY}; padding: 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px; }
    .body { padding: 28px 24px; font-size: 14px; line-height: 1.6; color: #333333; }
    .greeting { font-size: 16px; font-weight: 600; color: ${BRAND_DARK}; margin-bottom: 12px; }
    .content-box { background: ${BRAND_BG}; border: 1px solid #e7dfcf; border-radius: 6px; padding: 16px; margin: 18px 0; }
    .btn-container { text-align: center; margin: 24px 0; }
    .btn { display: inline-block; background: ${BRAND_PRIMARY}; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .table th { text-align: left; padding: 8px 4px; border-bottom: 2px solid #e7dfcf; font-size: 12px; color: ${BRAND_PRIMARY}; }
    .table td { padding: 8px 4px; border-bottom: 1px solid #f0ece1; font-size: 13px; }
    .footer { background: #fbf9f4; padding: 18px 24px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #eee; }
    .footer a { color: ${BRAND_PRIMARY}; text-decoration: none; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;">${preheader}</div>
  <div class="wrapper">
    <div class="header">
      <h1>${BRAND_NAME}</h1>
      <p>Pure, Traditional &amp; Sacred Products</p>
    </div>
    <div class="body">
      ${content}
      ${
        actionUrl && actionText
          ? `<div class="btn-container"><a href="${actionUrl}" class="btn" target="_blank">${actionText}</a></div>`
          : ""
      }
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
      <p style="margin: 0;">Need help? Reply to this email or visit <a href="${frontendUrl}/contact">Customer Care</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

class NotificationService {
  /**
   * Helper to execute email dispatch safely through emailService
   */
  async dispatch({ to, subject, html, text }) {
    try {
      const transporter = emailService.verifySmtp ? await emailService.verifySmtp() : null;
      // Use internal nodemailer call from emailService or fallback to direct send
      const nodemailer = require("nodemailer");
      const user = (process.env.SMTP_USER || process.env.SUPPORT_EMAIL || "brundavanamgaushala@gmail.com").trim();
      const pass = (process.env.SMTP_PASS || "").trim().replace(/\s+/g, "");

      if (!pass) {
        console.warn(`[NotificationService] SMTP_PASS not set. Email logged for ${to}: "${subject}"`);
        return { success: false, mocked: true };
      }

      const transport = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user, pass },
      });

      const info = await transport.sendMail({
        from: `"${BRAND_NAME}" <${user}>`,
        to,
        subject,
        html,
        text,
      });

      console.log(`[NotificationService] Email dispatched to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[NotificationService] Error sending email to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * 1. Order Placed & Confirmed Email to Customer
   */
  async sendOrderConfirmation(order) {
    const to = order.shippingAddress.email || order.billingAddress.email;
    if (!to) return;

    const subject = `Order Confirmed: #${order.orderNumber} — ${BRAND_NAME}`;
    const orderUrl = order.isGuest || !order.user
      ? `${frontendUrl}/track-order?orderNumber=${order.orderNumber}&email=${encodeURIComponent(to)}`
      : `${frontendUrl}/account/orders/${order._id}`;

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td><strong>${item.name}</strong>${item.variantLabel ? ` (${item.variantLabel})` : ""}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">INR ${item.subtotal.toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const content = `
      <div class="greeting">Namaste ${order.shippingAddress.fullName},</div>
      <p>Thank you for choosing <strong>${BRAND_NAME}</strong>. We are pleased to confirm that your order <strong>#${order.orderNumber}</strong> has been received and is being prepared with sacred care.</p>
      
      <div class="content-box">
        <h4 style="margin: 0 0 10px 0; color: ${BRAND_PRIMARY};">Order Summary</h4>
        <table class="table">
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div style="margin-top: 14px; text-align: right; font-size: 14px;">
          <p style="margin: 4px 0;"><strong>Grand Total:</strong> INR ${order.pricing.grandTotal.toFixed(2)}</p>
          <p style="margin: 4px 0; color: #666; font-size: 12px;">Payment: Paid via ${order.payment.provider.toUpperCase()}</p>
        </div>
      </div>

      <div class="content-box">
        <h4 style="margin: 0 0 8px 0; color: ${BRAND_PRIMARY};">Delivery Address</h4>
        <p style="margin: 0; font-size: 13px;">
          ${order.shippingAddress.fullName}<br>
          ${order.shippingAddress.line1}, ${order.shippingAddress.line2 || ""}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}<br>
          Phone: ${order.shippingAddress.phone}
        </p>
      </div>
      ${order.invoice?.invoiceUrl ? `<p>Your GST Tax Invoice is available for download at: <a href="${order.invoice.invoiceUrl}" target="_blank">Download Tax Invoice</a></p>` : ""}
    `;

    const html = renderOrderEmailShell({
      title: subject,
      preheader: `Your order #${order.orderNumber} of INR ${order.pricing.grandTotal} is confirmed!`,
      content,
      actionUrl: orderUrl,
      actionText: "Track Your Order",
    });

    return this.dispatch({
      to,
      subject,
      html,
      text: `Hello ${order.shippingAddress.fullName}, your order #${order.orderNumber} is confirmed. Grand Total: INR ${order.pricing.grandTotal}. View order: ${orderUrl}`,
    });
  }

  /**
   * 2. Order Shipped / Dispatched Email (with Shiprocket details)
   */
  async sendOrderShipped(order) {
    const to = order.shippingAddress.email || order.billingAddress.email;
    if (!to) return;

    const subject = `Shipped! Order #${order.orderNumber} is on its way — ${BRAND_NAME}`;
    const trackingUrl =
      order.shipping.trackingUrl ||
      (order.isGuest || !order.user
        ? `${frontendUrl}/track-order?orderNumber=${order.orderNumber}&email=${encodeURIComponent(to)}`
        : `${frontendUrl}/account/orders/${order._id}`);

    const content = `
      <div class="greeting">Great news, ${order.shippingAddress.fullName}!</div>
      <p>Your order <strong>#${order.orderNumber}</strong> has been handed over to our courier partner and is on its journey to you.</p>

      <div class="content-box">
        <h4 style="margin: 0 0 10px 0; color: ${BRAND_PRIMARY};">Shipment Information</h4>
        <p style="margin: 4px 0;"><strong>Courier Partner:</strong> ${order.shipping.courierName || "Shiprocket Express"}</p>
        <p style="margin: 4px 0;"><strong>Tracking (AWB) Number:</strong> ${order.shipping.awbCode || "In Transit"}</p>
        ${order.shipping.etd ? `<p style="margin: 4px 0;"><strong>Estimated Delivery Date:</strong> ${order.shipping.etd}</p>` : ""}
      </div>
    `;

    const html = renderOrderEmailShell({
      title: subject,
      preheader: `Your order #${order.orderNumber} has shipped with AWB ${order.shipping.awbCode}`,
      content,
      actionUrl: trackingUrl,
      actionText: "Track Live Shipment",
    });

    return this.dispatch({
      to,
      subject,
      html,
      text: `Your order #${order.orderNumber} has shipped via ${order.shipping.courierName}. AWB: ${order.shipping.awbCode}. Track here: ${trackingUrl}`,
    });
  }

  /**
   * 3. Order Delivered Email
   */
  async sendOrderDelivered(order) {
    const to = order.shippingAddress.email || order.billingAddress.email;
    if (!to) return;

    const subject = `Delivered: Order #${order.orderNumber} — ${BRAND_NAME}`;
    const reviewUrl = `${frontendUrl}/account/orders/${order._id}`;

    const content = `
      <div class="greeting">Namaste ${order.shippingAddress.fullName},</div>
      <p>Our records indicate that your order <strong>#${order.orderNumber}</strong> has been successfully delivered!</p>
      <p>We hope the sacred and pure products from our goshala bring nourishment, health, and peace to your family.</p>
      <p>We would love to hear your feedback on the quality and your shopping experience.</p>
    `;

    const html = renderOrderEmailShell({
      title: subject,
      preheader: `Your order #${order.orderNumber} has been delivered!`,
      content,
      actionUrl: reviewUrl,
      actionText: "View Order &amp; Share Feedback",
    });

    return this.dispatch({
      to,
      subject,
      html,
      text: `Your order #${order.orderNumber} has been delivered. Thank you for supporting Brundavanam Goshala!`,
    });
  }

  /**
   * 4. Order Cancellation & Refund Email
   */
  async sendOrderCancelled(order, refundInfo = {}) {
    const to = order.shippingAddress.email || order.billingAddress.email;
    if (!to) return;

    const subject = `Order Cancelled: #${order.orderNumber} — ${BRAND_NAME}`;
    const content = `
      <div class="greeting">Hello ${order.shippingAddress.fullName},</div>
      <p>As requested, your order <strong>#${order.orderNumber}</strong> has been cancelled.</p>
      ${
        refundInfo.amount
          ? `
        <div class="content-box">
          <h4 style="margin: 0 0 8px 0; color: ${BRAND_PRIMARY};">Refund Information</h4>
          <p style="margin: 4px 0;"><strong>Refund Amount:</strong> INR ${(refundInfo.amount / 100 || refundInfo.amount).toFixed(2)}</p>
          <p style="margin: 4px 0;"><strong>Refund ID:</strong> ${refundInfo.id || order.refund?.razorpayRefundId || "Processing"}</p>
          <p style="margin: 4px 0; color: #666; font-size: 13px;">The amount will be credited back to your original payment method within 5–7 working days as per bank norms.</p>
        </div>
      `
          : ""
      }
    `;

    const html = renderOrderEmailShell({
      title: subject,
      preheader: `Order #${order.orderNumber} has been cancelled.`,
      content,
      actionUrl: `${frontendUrl}/contact`,
      actionText: "Contact Support",
    });

    return this.dispatch({
      to,
      subject,
      html,
      text: `Your order #${order.orderNumber} has been cancelled. If payment was made, your refund is being processed.`,
    });
  }

  /**
   * 5. Admin Notification Alert for New Order
   */
  async sendAdminNewOrderAlert(order) {
    const adminEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || "brundavanamgaushala@gmail.com").trim();
    const subject = `[New Order] #${order.orderNumber} — INR ${order.pricing.grandTotal.toFixed(2)}`;
    const adminUrl = `${frontendUrl}/admin/orders/${order._id}`;

    const content = `
      <div class="greeting">New Order Alert</div>
      <p>A new order has been received on Brundavanam Goshala:</p>
      <div class="content-box">
        <p style="margin: 4px 0;"><strong>Order:</strong> #${order.orderNumber}</p>
        <p style="margin: 4px 0;"><strong>Customer:</strong> ${order.shippingAddress.fullName} (${order.shippingAddress.phone})</p>
        <p style="margin: 4px 0;"><strong>Items Count:</strong> ${order.items.length} items</p>
        <p style="margin: 4px 0;"><strong>Amount:</strong> INR ${order.pricing.grandTotal.toFixed(2)}</p>
        <p style="margin: 4px 0;"><strong>Payment:</strong> ${order.payment.status.toUpperCase()} (${order.payment.provider})</p>
      </div>
    `;

    const html = renderOrderEmailShell({
      title: subject,
      preheader: `New order #${order.orderNumber} received for INR ${order.pricing.grandTotal}`,
      content,
      actionUrl: adminUrl,
      actionText: "Open Order in Admin Panel",
    });

    return this.dispatch({
      to: adminEmail,
      subject,
      html,
      text: `New order received: #${order.orderNumber} for INR ${order.pricing.grandTotal}. Manage order at: ${adminUrl}`,
    });
  }

  /**
   * 6. Customer Return Request Acknowledgment
   */
  async sendReturnRequested(order) {
    const to = order.shippingAddress.email || order.billingAddress?.email;
    if (!to) return;

    const subject = `Return Request Received: Order #${order.orderNumber} — ${BRAND_NAME}`;
    const orderUrl = `${frontendUrl}/account/orders/${order._id}`;

    const content = `
      <div class="greeting">Namaste ${order.shippingAddress.fullName},</div>
      <p>We have received your return request for Order <strong>#${order.orderNumber}</strong>.</p>
      <div class="content-box">
        <h4 style="margin: 0 0 10px 0; color: ${BRAND_PRIMARY};">Return Request Details</h4>
        <p style="margin: 4px 0;"><strong>Reason:</strong> ${order.returnRequest?.reason || "Quality issue"}</p>
        ${order.returnRequest?.comments ? `<p style="margin: 4px 0;"><strong>Customer Notes:</strong> ${order.returnRequest.comments}</p>` : ""}
        <p style="margin: 4px 0;"><strong>Status:</strong> Under Review</p>
      </div>
      <p>Our team is reviewing the details. You will receive an update once the reverse pickup is scheduled via Shiprocket.</p>
    `;

    const html = renderOrderEmailShell({
      title: subject,
      preheader: `Return request acknowledged for Order #${order.orderNumber}`,
      content,
      actionUrl: orderUrl,
      actionText: "View Order & Return Status",
    });

    return this.dispatch({
      to,
      subject,
      html,
      text: `Your return request for order #${order.orderNumber} has been received and is being processed by Brundavanam Goshala.`,
    });
  }

  /**
   * 7. Return Reverse Pickup Scheduled Email
   */
  async sendReturnPickupScheduled(order) {
    const to = order.shippingAddress.email || order.billingAddress?.email;
    if (!to) return;

    const subject = `Return Pickup Scheduled: Order #${order.orderNumber} — ${BRAND_NAME}`;
    const trackingUrl = order.returnRequest?.returnTrackingUrl || `${frontendUrl}/account/orders/${order._id}`;

    const content = `
      <div class="greeting">Namaste ${order.shippingAddress.fullName},</div>
      <p>A reverse pickup has been arranged for Order <strong>#${order.orderNumber}</strong>.</p>
      <div class="content-box">
        <h4 style="margin: 0 0 10px 0; color: ${BRAND_PRIMARY};">Pickup & Courier Information</h4>
        <p style="margin: 4px 0;"><strong>Courier Partner:</strong> ${order.returnRequest?.returnCourierName || "Shiprocket Reverse Logistics"}</p>
        <p style="margin: 4px 0;"><strong>Return AWB Number:</strong> ${order.returnRequest?.returnAwbCode || "Assigned"}</p>
        <p style="margin: 4px 0;"><strong>Pickup Address:</strong> ${order.returnRequest?.pickupAddress?.line1}, ${order.returnRequest?.pickupAddress?.city} - ${order.returnRequest?.pickupAddress?.postalCode}</p>
      </div>
      <p style="font-size: 13px; color: #555;">Please keep the items securely packed. The courier agent will collect the parcel shortly.</p>
    `;

    const html = renderOrderEmailShell({
      title: subject,
      preheader: `Reverse pickup scheduled with AWB ${order.returnRequest?.returnAwbCode}`,
      content,
      actionUrl: trackingUrl,
      actionText: "Track Return Parcel",
    });

    return this.dispatch({
      to,
      subject,
      html,
      text: `Reverse pickup for order #${order.orderNumber} has been scheduled. Courier: ${order.returnRequest?.returnCourierName}, AWB: ${order.returnRequest?.returnAwbCode}.`,
    });
  }

  /**
   * 8. Return Received & Refund Completed Email
   */
  async sendReturnReceivedAndRefunded(order) {
    const to = order.shippingAddress.email || order.billingAddress?.email;
    if (!to) return;

    const subject = `Return Completed & Refund Processed: Order #${order.orderNumber} — ${BRAND_NAME}`;
    const orderUrl = `${frontendUrl}/account/orders/${order._id}`;
    const refundAmount = order.refund?.amount || order.pricing.grandTotal;

    const content = `
      <div class="greeting">Namaste ${order.shippingAddress.fullName},</div>
      <p>We have successfully received and verified the returned parcel for Order <strong>#${order.orderNumber}</strong> at our Goshala warehouse.</p>
      <div class="content-box">
        <h4 style="margin: 0 0 10px 0; color: ${BRAND_PRIMARY};">Refund Summary</h4>
        <p style="margin: 4px 0;"><strong>Refund Amount:</strong> INR ${refundAmount.toFixed(2)}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> ${order.refund?.status === "completed" ? "Successfully Initiated" : "Processed"}</p>
        ${order.refund?.razorpayRefundId ? `<p style="margin: 4px 0;"><strong>Razorpay Refund ID:</strong> ${order.refund.razorpayRefundId}</p>` : ""}
      </div>
      <p style="font-size: 13px; color: #555;">The refund will reflect in your original payment method (bank account / UPI / card) within 5-7 business days depending on your bank.</p>
    `;

    const html = renderOrderEmailShell({
      title: subject,
      preheader: `Refund of INR ${refundAmount.toFixed(2)} processed for Order #${order.orderNumber}`,
      content,
      actionUrl: orderUrl,
      actionText: "View Order History",
    });

    return this.dispatch({
      to,
      subject,
      html,
      text: `Your return for order #${order.orderNumber} has been received and refund of INR ${refundAmount.toFixed(2)} has been processed.`,
    });
  }
}

module.exports = new NotificationService();

