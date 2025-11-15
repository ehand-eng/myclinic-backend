const admin = require("firebase-admin");
const path = require("path");

// Attempt to load service account from env or fallback path
let fcmEnabled = false;
try {
    console.log("process.env.FIREBASE_SERVICE_ACCOUNT_PATH", process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.resolve(__dirname, "myclinic-smsgateway-firebase-adminsdk-fbsvc-d6b754f5af.json");
    console.log("serviceAccountPath", serviceAccountPath);
  const serviceAccount = require(serviceAccountPath);
    console.log("Service Account Project ID:", serviceAccount.project_id);
  if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  fcmEnabled = true;
} catch (err) {
  console.log(
    "[FCM] Service account not found or failed to initialize. Notifications are disabled.",
    err?.code === 'MODULE_NOT_FOUND' ? '' : err
  );
}

async function sendNotification(fcmToken, title, body, data = {}) {
    if (!fcmEnabled) {
      console.log("[FCM] Skipping notification send (FCM disabled)");
      return;
    }
  
    if (!fcmToken || typeof fcmToken !== "string") {
      console.error("[FCM] Invalid token format:", fcmToken);
      return;
    }
  
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        ...data, // include booking details here
      },
      android: {
        priority: "high",
      },
      apns: {
        payload: {
          aps: { sound: "default" },
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
