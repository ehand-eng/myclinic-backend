
# MyClinic API Server

This is the backend server for the MyClinic application.

## Setup Instructions

Before running the server, you need to install the dependencies:

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm run setup
```

## Running the Server

After installing dependencies, you can start the server:

```bash
# Start the server with Node.js
npm start

# Or for development with auto-reload
npm run dev
```

## Seeding the Database

To populate the database with initial data:

```bash
npm run seed
```

## Environment Variables

Make sure the .env file is properly configured with:
- MONGODB_URI: MongoDB connection string
- PORT: Server port (defaults to 5000)
- JWT_SECRET: Secret key for JWT authentication
