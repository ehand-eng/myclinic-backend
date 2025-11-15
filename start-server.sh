
#!/bin/bash

echo "Setting up and starting MyClinic server..."
echo "This will start the server on port 5000 by default"

# Navigate to server directory
cd server

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
else
  echo "Dependencies already installed."
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Warning: .env file not found in server directory."
  echo "Creating a default .env file..."
  echo "MONGODB_URI=mongodb+srv://myclinicuser:1qaz2wsx%40E@myclinic-cluster.ht5hi.mongodb.net/?retryWrites=true&w=majority&appName=myclinic-cluster" > .env
  echo "PORT=5001" >> .env
  echo "JWT_SECRET=myclinic-secret-key-change-in-production" >> .env
  echo "Default .env file created."
fi

# Remind user about API URL
echo ""
echo "IMPORTANT: Make sure your frontend .env file has VITE_API_URL set to http://localhost:5000/api"
echo "If you need to use a different port, update both the server PORT in server/.env and the VITE_API_URL in .env"
echo ""

# Start the server
echo "Starting server..."
npm start

