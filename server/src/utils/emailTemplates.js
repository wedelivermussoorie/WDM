const sendEmail = require("./sendEmail");

/**
 * Sends an order confirmation email after a successful order placement.
 * @param {Object} user  - { name, email }
 * @param {Object} order - Mongoose Order document
 */
async function sendOrderConfirmationEmail(user, order, invoiceBuffer) {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0;">
          ${item.name}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; text-align: right;">
          ₹${item.price.toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  const paymentBadge =
    order.paymentMethod === "Razorpay"
      ? `<span style="background:#16a34a;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;">Paid Online</span>`
      : `<span style="background:#f59e0b;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;">Cash on Delivery</span>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
      <!-- Header -->
      <div style="background: #16a34a; padding: 28px 32px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px;">✅ Order Confirmed!</h1>
        <p style="color: #dcfce7; margin: 8px 0 0; font-size: 14px;">Thank you for shopping with We Deliver Mussoorie</p>
      </div>

      <!-- Body -->
      <div style="padding: 28px 32px;">
        <p style="font-size: 16px; color: #374151;">Hi <strong>${user.name}</strong>,</p>
        <p style="font-size: 15px; color: #4b5563;">Your order has been placed successfully! Please find your invoice attached. Here's a summary:</p>

        <!-- Order Meta -->
        <table style="width:100%;font-size:14px;color:#374151;margin-bottom:20px;">
          <tr>
            <td style="padding:4px 0;color:#6b7280;">Order ID</td>
            <td style="padding:4px 0;font-weight:600;text-align:right;">#${order._id.toString().slice(-8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6b7280;">Payment</td>
            <td style="padding:4px 0;text-align:right;">${paymentBadge}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6b7280;">Status</td>
            <td style="padding:4px 0;font-weight:600;color:#16a34a;text-align:right;">${order.status}</td>
          </tr>
        </table>

        <!-- Items Table -->
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:10px 8px;text-align:left;font-weight:600;border-bottom:2px solid #e5e7eb;">Item</th>
              <th style="padding:10px 8px;text-align:center;font-weight:600;border-bottom:2px solid #e5e7eb;">Qty</th>
              <th style="padding:10px 8px;text-align:right;font-weight:600;border-bottom:2px solid #e5e7eb;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:12px 8px;font-weight:700;font-size:15px;">Total</td>
              <td style="padding:12px 8px;font-weight:700;font-size:15px;text-align:right;color:#16a34a;">₹${order.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Shipping Address -->
        ${
          order.shippingAddress
            ? `
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-top:20px;">
          <p style="margin:0 0 8px;font-weight:600;font-size:14px;color:#374151;">📦 Delivery Address</p>
          <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">
            ${order.shippingAddress.fullName ? order.shippingAddress.fullName + "<br>" : ""}
            ${order.shippingAddress.street || order.shippingAddress.line1 || ""}
            ${order.shippingAddress.line2 ? ", " + order.shippingAddress.line2 : ""}
            ${order.shippingAddress.landmark ? "<br>" + order.shippingAddress.landmark : ""}
            <br>${order.shippingAddress.city}, ${order.shippingAddress.state} – ${order.shippingAddress.pincode}
          </p>
        </div>`
            : ""
        }

        <p style="font-size:14px;color:#6b7280;margin-top:24px;">We'll notify you again once your order is delivered. If you have any questions, feel free to reach out to us.</p>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">© 2025 We Deliver Mussoorie · Mussoorie, Uttarakhand</p>
      </div>
    </div>
  `;

  const emailOptions = {
    to: user.email,
    subject: `Order Confirmed – #${order._id.toString().slice(-8).toUpperCase()} | We Deliver Mussoorie`,
    html,
  };

  if (invoiceBuffer) {
    emailOptions.attachments = [
      {
        filename: `Invoice_${order._id.toString().slice(-8).toUpperCase()}.pdf`,
        content: invoiceBuffer,
      },
    ];
  }

  await sendEmail(emailOptions);
}

/**
 * Sends a delivery notification email when admin marks an order as "Delivered".
 * @param {Object} user  - { name, email }
 * @param {Object} order - Mongoose Order document
 */
async function sendDeliveryEmail(user, order) {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 6px; border-bottom: 1px solid #f0f0f0;">${item.name}</td>
        <td style="padding: 8px 6px; border-bottom: 1px solid #f0f0f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 6px; border-bottom: 1px solid #f0f0f0; text-align: right;">₹${item.price.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
      <!-- Header -->
      <div style="background: #1d4ed8; padding: 28px 32px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px;">🎉 Your Order Has Been Delivered!</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">We hope you enjoy your purchase!</p>
      </div>

      <!-- Body -->
      <div style="padding: 28px 32px;">
        <p style="font-size: 16px; color: #374151;">Hi <strong>${user.name}</strong>,</p>
        <p style="font-size: 15px; color: #4b5563;">
          Great news! Your order <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong> has been successfully delivered.
        </p>

        <!-- Items Table -->
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;margin-top:16px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:10px 6px;text-align:left;font-weight:600;border-bottom:2px solid #e5e7eb;">Item</th>
              <th style="padding:10px 6px;text-align:center;font-weight:600;border-bottom:2px solid #e5e7eb;">Qty</th>
              <th style="padding:10px 6px;text-align:right;font-weight:600;border-bottom:2px solid #e5e7eb;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:12px 6px;font-weight:700;font-size:15px;">Total Paid</td>
              <td style="padding:12px 6px;font-weight:700;font-size:15px;text-align:right;color:#1d4ed8;">₹${order.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background:#eff6ff;border-radius:8px;padding:16px;margin-top:20px;border-left:4px solid #1d4ed8;">
          <p style="margin:0;font-size:14px;color:#1e40af;">
            💙 Thank you for choosing <strong>We Deliver Mussoorie</strong>! We hope to serve you again soon.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">© 2025 We Deliver Mussoorie · Mussoorie, Uttarakhand</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: `Your Order Has Been Delivered – #${order._id.toString().slice(-8).toUpperCase()} | We Deliver Mussoorie`,
    html,
  });
}

module.exports = { sendOrderConfirmationEmail, sendDeliveryEmail };
