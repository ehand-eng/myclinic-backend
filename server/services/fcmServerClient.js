const admin = require("firebase-admin");
const path = require("path");

// Attempt to load service account from env or fallback path
let fcmEnabled = false;
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.resolve(__dirname, "myclinic-smsgateway-firebase-adminsdk-fbsvc-d6b754f5af.json");
    console.log("serviceAccountPath", serviceAccountPath);
  const serviceAccount = require(serviceAccountPath);
    console.log(serviceAccount);
  if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  fcmEnabled = true;
} catch (err) {
  console.warn(
    "[FCM] Service account not found or failed to initialize. Notifications are disabled.",
    err?.code === 'MODULE_NOT_FOUND' ? '' : err
  );
}

/**
 * Send notification via FCM HTTP v1
 * @param {string} fcmToken - The device's FCM registration token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
async function sendNotification(fcmToken, title, body) {
  if (!fcmEnabled) {
    console.log("[FCM] Skipping notification send (FCM disabled)");
    return;
  }

  const message = {
    token: fcmToken,
    notification: {
      title: title,
      body: body,
    },
    android: {
      priority: "high",
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Successfully sent message:", response);
  } catch (error) {
    console.error("❌ Error sending message:", error);
  }
}

module.exports = { sendNotification };
