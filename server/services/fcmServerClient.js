const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Attempt to load service account from env or fallback path
let fcmEnabled = false;
let appInitialized = false;

function initializeFCM() {
  if (appInitialized) {
    return fcmEnabled;
  }

  try {
    console.log("process.env.FIREBASE_SERVICE_ACCOUNT_PATH", process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      : path.resolve(__dirname, "myclinic-smsgateway-firebase-adminsdk-fbsvc-7d769f9adb.json");
    
    console.log("serviceAccountPath", serviceAccountPath);

    // Check if file exists
    if (!fs.existsSync(serviceAccountPath)) {
      console.error("[FCM] Service account file not found at:", serviceAccountPath);
      appInitialized = true;
      return false;
    }

    const serviceAccount = require(serviceAccountPath);
    console.log("Service Account Project ID:", serviceAccount.project_id);

    // Validate required fields
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      console.error("[FCM] Service account file is missing required fields");
      appInitialized = true;
      return false;
    }

    // Check if app is already initialized
    if (admin.apps && admin.apps.length > 0) {
      console.log("[FCM] Firebase app already initialized");
      fcmEnabled = true;
      appInitialized = true;
      return true;
    }

    // Initialize Firebase app
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("[FCM] Firebase app initialized successfully");

    // Credentials will be validated on first actual use
    fcmEnabled = true;
    appInitialized = true;
    console.log("[FCM] FCM initialized and enabled");
    return true;
  } catch (err) {
    console.error(
      "[FCM] Service account not found or failed to initialize. Notifications are disabled.",
      err?.code === 'MODULE_NOT_FOUND' ? err.message : err.message
    );
    console.error("[FCM] Error details:", err);
    fcmEnabled = false;
    appInitialized = true;
    return false;
  }
}

// Initialize on module load
initializeFCM();

// Helper function to convert all data values to strings (FCM requirement)
function stringifyData(data) {
  const stringified = {};
  for (const [key, value] of Object.entries(data)) {
    stringified[key] = String(value);
  }
  return stringified;
}

async function sendNotification(fcmToken, title, body, data = {}) {
  console.log("[FCM] Sending notification:", { fcmToken: fcmToken?.substring(0, 20) + "...", title, body });
  console.log("[FCM] Data payload:", data);
  
  // Re-initialize if needed
  if (!appInitialized) {
    initializeFCM();
  }

  if (!fcmEnabled) {
    console.log("[FCM] Skipping notification send (FCM disabled)");
    return { success: false, error: "FCM disabled" };
  }

  if (!fcmToken || typeof fcmToken !== "string") {
    console.error("[FCM] Invalid token format:", fcmToken);
    return { success: false, error: "Invalid token format" };
  }

  // Get the Firebase app (default app)
  let app;
  try {
    app = admin.app();
  } catch (err) {
    console.error("[FCM] No Firebase app available");
    return { success: false, error: "Firebase app not initialized" };
  }

  // Convert all data values to strings (FCM requirement)
  const stringifiedData = stringifyData(data);

  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data: stringifiedData,
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
    const response = await admin.messaging(app).send(message);
    console.log("✅ Successfully sent FCM message:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("❌ Error sending FCM message:", error);
    
    // Handle specific error cases
    if (error.code === 'app/invalid-credential') {
      console.error("[FCM] ====== INVALID CREDENTIALS ERROR ======");
      console.error("[FCM] The Firebase service account credentials are invalid or revoked.");
      console.error("[FCM] The 'private_key_id' in your JSON file is: d6b754f5afeed57de884eaf2798f60c71e37415f");
      console.error("[FCM] (Note: This ID is only visible in the JSON file, not in Firebase Console UI)");
      console.error("[FCM]");
      console.error("[FCM] To fix this, generate a NEW private key:");
      console.error("[FCM] 1. Go to Firebase Console: https://console.firebase.google.com/");
      console.error("[FCM] 2. Select your project: myclinic-smsgateway");
      console.error("[FCM] 3. Go to Project Settings > Service Accounts tab");
      console.error("[FCM] 4. Click the 'Generate new private key' button");
      console.error("[FCM] 5. Download the new JSON file");
      console.error("[FCM] 6. Replace the existing file at:");
      console.error("[FCM]    ", path.resolve(__dirname, "myclinic-smsgateway-firebase-adminsdk-fbsvc-d6b754f5af.json"));
      console.error("[FCM] 7. Restart your server");
      console.error("[FCM]");
      console.error("[FCM] Also ensure your server time is synced correctly.");
      console.error("[FCM] =======================================");
      fcmEnabled = false; // Disable FCM to prevent repeated failures
      appInitialized = true; // Mark as initialized to prevent retries
    } else if (error.code === 'messaging/invalid-registration-token' || 
               error.code === 'messaging/registration-token-not-registered') {
      console.error("[FCM] Invalid or unregistered FCM token. The token may be expired or invalid.");
    } else if (error.code === 'messaging/invalid-argument') {
      console.error("[FCM] Invalid message payload. Check the message structure.");
    } else {
      console.error("[FCM] Unexpected error code:", error.code);
    }
    
    return { success: false, error: error.message, code: error.code };
  }
}

module.exports = { sendNotification, initializeFCM };
