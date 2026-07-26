/**
 * WhatsApp Cloud API utility for We Deliver Mussoorie
 *
 * Phone number resolution order (first non-empty wins):
 *   1. order.shippingAddress.phone  — phone entered at checkout
 *   2. user.phone                   — phone registered with account
 *   3. user.addresses.shipping.phone — saved shipping address phone
 *   4. user.addresses.billing.phone  — saved billing address phone
 *
 * Template strategy:
 *  - Order Confirmation → jaspers_market_order_confirmation_v1 (UTILITY / APPROVED)
 *      {{1}} = customer name, {{2}} = short order ID, {{3}} = delivery ETA
 *  - Delivery Update   → thank_you_for_ordering (MARKETING / APPROVED)
 *      No parameters — static message
 *
 * Both templates are pre-approved by Meta so they reach customers outside
 * the 24-hour customer-initiated window.
 */

/**
 * Normalize any Indian phone number to 12-digit E.164 (no plus sign).
 * Returns null if the input cannot be converted to a plausible number.
 */
function normalizePhoneNumber(phone) {
  if (!phone) return null;

  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;

  // Already 12-digit with country code 91
  if (digits.startsWith("91") && digits.length === 12) {
    return digits;
  }

  // Leading zero (local Indian format: 0XXXXXXXXXX)
  if (digits.startsWith("0") && digits.length === 11) {
    return `91${digits.slice(1)}`;
  }

  // Plain 10-digit Indian mobile
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // Return as-is for international numbers that don't match above patterns
  return digits.length >= 7 ? digits : null;
}

/**
 * Resolve the best available phone number for a user's order.
 * Tries multiple sources in priority order so that any registered
 * phone number on the account will be found.
 */
function resolveRecipientPhone(user, order) {
  const candidates = [
    order?.shippingAddress?.phone,          // 1. checkout address phone
    user?.phone,                            // 2. account registration phone
    user?.addresses?.shipping?.phone,       // 3. saved shipping address phone
    user?.addresses?.billing?.phone,        // 4. saved billing address phone
  ];

  for (const candidate of candidates) {
    const normalized = normalizePhoneNumber(candidate);
    if (normalized) return normalized;
  }

  return null;
}

async function postWhatsAppPayload(payload) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error("WhatsApp environment variables are not configured");
  }

  const response = await fetch(
    `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || "WhatsApp API request failed";
    const code = data?.error?.code;
    throw new Error(`[${code}] ${message}`);
  }

  return data;
}

/**
 * Build a template message payload.
 *
 * @param {string} to           - Recipient phone in E.164 format (no +)
 * @param {string} templateName
 * @param {string} languageCode - e.g. "en_US" or "en"
 * @param {Array}  bodyValues   - strings for {{1}}, {{2}}, ...
 */
function buildTemplatePayload(to, templateName, languageCode, bodyValues) {
  languageCode = languageCode || "en_US";
  bodyValues = bodyValues || [];
  const components = [];

  if (bodyValues.length > 0) {
    components.push({
      type: "body",
      parameters: bodyValues.map((value) => ({
        type: "text",
        text: String(value),
      })),
    });
  }

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components: components.length > 0 ? components : undefined,
    },
  };
}

/**
 * Send WhatsApp order confirmation using the approved
 * jaspers_market_order_confirmation_v1 template.
 *
 * Template body:
 *   "Hi {{1}},
 *    Thank you for your purchase! Your order number is {{2}}.
 *    We'll start getting your farm fresh groceries ready to ship.
 *    Estimated delivery: {{3}}.
 *    We will let you know when your order ships."
 *
 * @param {object} user  - Mongoose User document (full, not sanitized)
 * @param {object} order - Mongoose Order document
 */
async function sendWhatsAppOrderConfirmation(user, order) {
  const recipient = resolveRecipientPhone(user, order);

  if (!recipient) {
    return {
      skipped: true,
      reason: "No phone number found on account or shipping address",
    };
  }

  const shortOrderId = order._id.toString().slice(-8).toUpperCase();
  const customerName =
    user?.name || order?.shippingAddress?.fullName || "Customer";

  const templateName =
    process.env.WHATSAPP_ORDER_TEMPLATE_NAME ||
    "jaspers_market_order_confirmation_v1";
  const languageCode =
    process.env.WHATSAPP_ORDER_TEMPLATE_LANGUAGE || "en_US";

  const payload = buildTemplatePayload(
    recipient,
    templateName,
    languageCode,
    [customerName, shortOrderId, "Same day (1-2 hours)"]
  );

  console.log(
    "[WhatsApp] Sending order confirmation to " + recipient + " (order #" + shortOrderId + ")"
  );

  return postWhatsAppPayload(payload);
}

/**
 * Send WhatsApp delivery notification using the approved
 * thank_you_for_ordering template.
 *
 * @param {object} user  - Mongoose User document (full, not sanitized)
 * @param {object} order - Mongoose Order document
 */
async function sendWhatsAppDeliveryUpdate(user, order) {
  const recipient = resolveRecipientPhone(user, order);

  if (!recipient) {
    return {
      skipped: true,
      reason: "No phone number found on account or shipping address",
    };
  }

  const deliveryTemplateName =
    process.env.WHATSAPP_DELIVERY_TEMPLATE_NAME || "thank_you_for_ordering";
  const deliveryLanguageCode =
    process.env.WHATSAPP_DELIVERY_TEMPLATE_LANGUAGE || "en";

  const payload = buildTemplatePayload(
    recipient,
    deliveryTemplateName,
    deliveryLanguageCode,
    [] // no body parameters for this template
  );

  console.log(
    "[WhatsApp] Sending delivery update to " + recipient + " (order #" + order._id.toString().slice(-8).toUpperCase() + ")"
  );

  return postWhatsAppPayload(payload);
}

module.exports = {
  normalizePhoneNumber,
  resolveRecipientPhone,
  sendWhatsAppOrderConfirmation,
  sendWhatsAppDeliveryUpdate,
};

