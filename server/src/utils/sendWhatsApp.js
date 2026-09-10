/**
 * WhatsApp Cloud API utility for We Deliver Mussoorie
 *
 * Phone number resolution order (first non-empty wins):
 *   1. user.phone                   — phone registered with account
 *   2. order.shippingAddress.phone  — phone entered at checkout
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
    user?.phone,                            // 1. account registration phone
    order?.shippingAddress?.phone,          // 2. checkout address phone
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
  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  // Fallback to verified credentials if cloud environment (Render) variables are missing or set to old IDs
  if (!phoneNumberId || phoneNumberId === "26045457848391537" || phoneNumberId === "969337969593147") {
    phoneNumberId = "927443587126052";
  }
  if (!accessToken) {
    accessToken = "EAARAohZABLdQBSUfq4UvJv6duJzFbr4IgbPZCfSxmfhH08DZB9IdolFULrIWE7Oh22ZCA0PIThYFwKaT3u3p4cMDhuPNtj99rRJZBikGjMP9dJIjqEeeQIWTvEteveEUE2quqbZBI2gnWUVmPS7Mh5uHNWZBLcdOnjXyd1ZBiBgW58yEvGAeumzkLRTnFQTj6gZDZD";
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
 * Send WhatsApp order confirmation using approved Meta templates.
 * Attempts custom template wdm_order_confirmation first, falling back to order_management_1 if pending.
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
  const address = order?.shippingAddress?.street
    ? `${order.shippingAddress.street}, ${order.shippingAddress.city || "Mussoorie"}`
    : "Mussoorie";

  // Try custom requested template wdm_order_confirmation first
  try {
    const payload = buildTemplatePayload(
      recipient,
      "wdm_order_confirmation",
      "en",
      [customerName]
    );
    console.log("[WhatsApp] Sending custom order confirmation to " + recipient + " (order #" + shortOrderId + ")");
    return await postWhatsAppPayload(payload);
  } catch (err) {
    console.log("[WhatsApp] Custom template pending/error, using approved wdm_delivery_update fallback:", err.message);
    const fallbackPayload = buildTemplatePayload(
      recipient,
      "wdm_delivery_update",
      "en",
      [customerName, `#${shortOrderId}`, "We Deliver Mussoorie", "Immediate", address]
    );
    return await postWhatsAppPayload(fallbackPayload);
  }
}

/**
 * Send WhatsApp delivery notification using approved Meta templates.
 * Default template: wdm_delivery_completed (en)
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

  const shortOrderId = order._id.toString().slice(-8).toUpperCase();
  const customerName =
    user?.name || order?.shippingAddress?.fullName || "Customer";
  const address = order?.shippingAddress?.street
    ? `${order.shippingAddress.street}, ${order.shippingAddress.city || "Mussoorie"}`
    : "Mussoorie";

  const deliveryTemplateName =
    process.env.WHATSAPP_DELIVERY_TEMPLATE_NAME || "wdm_delivery_completed";
  const deliveryLanguageCode =
    process.env.WHATSAPP_DELIVERY_TEMPLATE_LANGUAGE || "en";

  let bodyParams;
  if (deliveryTemplateName === "wdm_delivery_completed") {
    bodyParams = [customerName, `#${shortOrderId}`, address];
  } else {
    bodyParams = [];
  }

  const payload = buildTemplatePayload(
    recipient,
    deliveryTemplateName,
    deliveryLanguageCode,
    bodyParams
  );

  console.log(
    "[WhatsApp] Sending delivery update to " + recipient + " (order #" + shortOrderId + ")"
  );

  return postWhatsAppPayload(payload);
}

module.exports = {
  normalizePhoneNumber,
  resolveRecipientPhone,
  sendWhatsAppOrderConfirmation,
  sendWhatsAppDeliveryUpdate,
};

