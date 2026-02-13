# Environment Variables Guide for Render Deployment

This document lists all environment variables needed for both backend and frontend services.

## 🔴 BACKEND SERVICE (myclinic-backend)

Set these in the **Backend Service** → **Environment** tab in Render dashboard.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret key for JWT token generation | `your-super-secret-jwt-key-here` |
| `PORT` | Server port (Render sets this automatically, but you can override) | `10000` |
| `NODE_ENV` | Environment mode | `production` |

### Auth0 Variables (Required if using Auth0)

| Variable | Description | Example |
|----------|-------------|---------|
| `AUTH0_DOMAIN` | Your Auth0 domain | `your-app.auth0.com` |
| `AUTH0_CLIENT_ID` | Auth0 application client ID | `abc123xyz` |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret | `secret123` |
| `AUTH0_AUDIENCE` | Auth0 API audience | `https://your-api.com` |
| `AUTH0_CALLBACK_URL` | Auth0 callback URL | `https://your-backend-url.onrender.com/api/auth/callback` |

### Payment Gateway - Dialog Genie (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `DIALOG_GENIE_API_URL` | Dialog Genie API endpoint | `https://api.dialoggenie.com` |
| `DIALOG_GENIE_API_KEY` | Dialog Genie API key | `your-api-key` |
| `DIALOG_GENIE_PAYMENT_URL` | Dialog Genie payment URL | `https://pay.dialoggenie.com` |

### SMS Service - Dialog SMS (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `DIALOG_SMS_URL` | Dialog SMS API URL | `https://e-sms.dialog.lk/api/v2` |
| `DIALOG_SMS_USERNAME` | Dialog SMS username | `your-username` |
| `DIALOG_SMS_PASSWORD` | Dialog SMS password | `your-password` |

### AWS Services (Optional - for OTP/Email)

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `FROM_EMAIL` | Email address for sending emails | `noreply@yourdomain.com` |

### Firebase (Optional - for FCM push notifications)

| Variable | Description | Example |
|----------|-------------|---------|
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase service account JSON file | `/opt/render/project/src/server/services/firebase-key.json` |

### Frontend URL (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `FRONTEND_URL` | Frontend application URL (for redirects) | `https://your-frontend-url.onrender.com` |

### Development/Logging (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `INFO`, `DEBUG`, `ERROR`, `WARN` |
| `BYPASS_AUTH` | Bypass authentication (development only) | `false` (never use `true` in production!) |
| `FCM_TOKEN` | FCM token for testing | (optional) |

---

## 🟢 FRONTEND SERVICE (myclinic-frontend)

Set these in the **Frontend Service** → **Environment** tab in Render dashboard.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL with `/api` path | `https://myclinic-backend-abc123.onrender.com/api` |
| `VITE_API_BASE_URL` | Backend API base URL (without `/api`) | `https://myclinic-backend-abc123.onrender.com` |
| `PORT` | Server port (Render sets this automatically) | `10000` |
| `NODE_ENV` | Environment mode | `production` |

---

## 📝 Quick Setup Checklist

### Backend Service Setup:
- [ ] Set `MONGODB_URI`
- [ ] Set `JWT_SECRET`
- [ ] Set Auth0 variables (if using Auth0)
- [ ] Set Dialog Genie variables (if using payment gateway)
- [ ] Set Dialog SMS variables (if using SMS)
- [ ] Set AWS variables (if using AWS for OTP/Email)
- [ ] Set Firebase path (if using FCM)
- [ ] Set `FRONTEND_URL` (optional, for redirects)

### Frontend Service Setup:
- [ ] Wait for backend to deploy first
- [ ] Get backend URL from Render dashboard
- [ ] Set `VITE_API_URL` = `https://your-backend-url.onrender.com/api`
- [ ] Set `VITE_API_BASE_URL` = `https://your-backend-url.onrender.com`

---

## ⚠️ Important Notes

1. **Backend URL First**: Deploy backend first, then use its URL for frontend environment variables
2. **Vite Variables**: Frontend variables must start with `VITE_` to be accessible in the React app
3. **Build Time**: Vite environment variables are embedded at build time, so set them before building
4. **Secrets**: Never commit `.env` files to Git. Always set secrets in Render dashboard
5. **Callback URLs**: Update `AUTH0_CALLBACK_URL` and `FRONTEND_URL` with your actual Render URLs after deployment

---

## 🔄 After Deployment

1. Update `AUTH0_CALLBACK_URL` in Auth0 dashboard to match your backend URL
2. Update `FRONTEND_URL` in backend if you set it
3. Rebuild frontend if you change `VITE_API_URL` or `VITE_API_BASE_URL` after initial build
