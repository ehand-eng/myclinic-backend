# Render Deployment Guide for MyClinic

This guide will help you deploy your MyClinic application (backend server and frontend) to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your MongoDB connection string
3. All your environment variables ready
4. Your GitHub repository connected to Render (or you can deploy via Git)

## Project Structure

- **Backend Server**: Located in `/server` directory
- **Frontend**: Located in root directory (React/Vite application)

## Step-by-Step Deployment Instructions

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub**
   - Make sure your `render.yaml` file is in the root of your repository
   - Commit and push all changes

2. **Create a New Blueprint in Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Configure Environment Variables**
   
   After the blueprint is created, you need to set environment variables for both services:

   **For Backend Service (myclinic-backend):**
   - Go to the backend service dashboard
   - Navigate to "Environment" tab
   - Add the following environment variables:
     ```
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret_key
     AUTH0_DOMAIN=your_auth0_domain
     AUTH0_CLIENT_ID=your_auth0_client_id
     AUTH0_CLIENT_SECRET=your_auth0_client_secret
     AUTH0_AUDIENCE=your_auth0_audience
     AUTH0_CALLBACK_URL=https://your-backend-url.onrender.com/api/auth/callback
     DIALOG_GENIE_API_URL=your_dialog_genie_api_url (optional)
     DIALOG_GENIE_API_KEY=your_dialog_genie_api_key (optional)
     DIALOG_GENIE_PAYMENT_URL=your_dialog_genie_payment_url (optional)
     FIREBASE_SERVICE_ACCOUNT_PATH=path_to_firebase_service_account (optional)
     ```

   **For Frontend Service (myclinic-frontend):**
   - Go to the frontend service dashboard
   - Navigate to "Environment" tab
   - Add the following environment variables:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com/api
     VITE_API_BASE_URL=https://your-backend-url.onrender.com
     ```
     ⚠️ **Important**: Replace `your-backend-url` with the actual URL of your backend service (e.g., `myclinic-backend-abc123.onrender.com`)

4. **Deploy**
   - Render will automatically start building and deploying both services
   - Monitor the build logs in the Render dashboard
   - Wait for both services to be "Live"

### Option 2: Manual Service Creation

If you prefer to create services manually:

#### Backend Service Setup

1. **Create a New Web Service**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Backend Service:**
   - **Name**: `myclinic-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Root Directory**: Leave empty (root of repo)

3. **Set Environment Variables** (same as above)

#### Frontend Service Setup

1. **Create Another Web Service**
   - Click "New +" → "Web Service"
   - Connect the same GitHub repository

2. **Configure Frontend Service:**
   - **Name**: `myclinic-frontend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node frontend-server.js`
   - **Root Directory**: Leave empty (root of repo)

3. **Set Environment Variables** (same as above)

## Important Notes

### Port Configuration
- Render automatically assigns a `PORT` environment variable
- Both services will use `process.env.PORT` (defaults to 10000 in render.yaml)
- Your server code already handles this correctly

### Backend URL for Frontend
- After deploying the backend, note its URL (e.g., `https://myclinic-backend-abc123.onrender.com`)
- Update the frontend environment variables with this URL:
  - `VITE_API_URL=https://myclinic-backend-abc123.onrender.com/api`
  - `VITE_API_BASE_URL=https://myclinic-backend-abc123.onrender.com`

### CORS Configuration
- Your backend already has CORS enabled, which should work with Render
- If you encounter CORS issues, make sure your frontend URL is allowed in the backend CORS configuration

### WebSocket Support
- Your backend uses WebSocket for real-time features
- Render supports WebSocket connections on web services
- The WebSocket endpoint will be available at: `wss://your-backend-url.onrender.com/ws`

### Firebase Service Account
- If you're using Firebase, you'll need to upload the service account JSON file
- You can either:
  1. Store the JSON content as an environment variable and write it to a file in the build process
  2. Use Render's file system (note: files are ephemeral, so you may need to recreate them on each deploy)

### Custom Domains
- After deployment, you can add custom domains in the Render dashboard
- Go to your service → Settings → Custom Domains
- Follow Render's instructions to configure DNS

## Troubleshooting

### Build Failures
- Check the build logs in Render dashboard
- Ensure all dependencies are listed in `package.json`
- Verify Node.js version compatibility

### Environment Variables Not Working
- Make sure variables are set in the correct service
- Restart the service after adding new environment variables
- Check for typos in variable names

### Frontend Can't Connect to Backend
- Verify `VITE_API_URL` and `VITE_API_BASE_URL` are set correctly
- Check that the backend service is running
- Verify CORS is enabled on the backend

### Database Connection Issues
- Verify `MONGODB_URI` is correct
- Check MongoDB network access (whitelist Render IPs if needed)
- Ensure MongoDB connection string includes proper authentication

## Post-Deployment Checklist

- [ ] Backend service is live and accessible
- [ ] Frontend service is live and accessible
- [ ] Frontend can make API calls to backend
- [ ] Authentication is working
- [ ] Database connection is established
- [ ] WebSocket connections are working (if applicable)
- [ ] Custom domains are configured (if applicable)
- [ ] SSL certificates are active (automatic with Render)

## Support

For Render-specific issues, check:
- Render Documentation: https://render.com/docs
- Render Status: https://status.render.com

For application-specific issues, check your application logs in the Render dashboard.
