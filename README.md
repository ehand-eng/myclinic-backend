
# MyClinic Management System

## How to Run the Application

### 1. Make sure you have the correct environment setup

Ensure your `.env` file has the correct API URL:

```
VITE_API_URL=http://localhost:5000/api
```

If your server runs on a different port, update this URL accordingly.

### 2. Start the API Server

The backend API server needs to be running before the frontend can connect to it:

```bash
# Method 1: Using the start script (recommended)
# Make the script executable first (one-time setup)
chmod +x start-server.sh
# Then run the script
./start-server.sh

# Method 2: Manual setup
cd server
npm install
npm start
```

The server will run at http://localhost:5000 by default.

### 3. Start the Frontend

In a new terminal window:

```bash
npm run dev
```

This will start the Vite development server and you can access the application at http://localhost:8080

## Test Credentials

- Email: admin@example.com
- Password: 123456

## Development Mode

The application includes a development mode that allows you to use the frontend even when the API server is not running. In development mode, authentication is simulated.

### Debugging Server Connection Issues

If you encounter a "Server Unavailable" message:

1. Check that the server is running (`./start-server.sh`).
2. Verify the VITE_API_URL in your .env file matches the port your server is using.
3. If using a different port than 5000, update both the frontend .env and the server/.env files.
4. The app will automatically switch to simulated login if the server is unavailable.

## Notes

- The API server runs at http://localhost:5000 by default
- The MongoDB connection string is configured in server/.env
- If you encounter any MongoDB connection issues, check your .env file and internet connection

