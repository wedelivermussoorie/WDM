const crypto = require("crypto");
try {
  crypto.createHmac("sha256", undefined).update("test").digest("hex");
} catch (e) {
  console.log("Error:", e.message);
}
