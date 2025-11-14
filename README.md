# Site Streamer

A simple web application that proxies and streams content from movies.do, allowing users to bypass geo-restrictions. The website is loaded server-side and streamed to users, enabling access to content regardless of location.

## Features

- **Server-side proxy**: All requests are made from the server, bypassing client-side geo-restrictions
- **URL rewriting**: Automatically rewrites all URLs in the proxied content to go through the proxy
- **Streaming support**: Handles video streaming and file downloads
- **Simple interface**: Clean, modern UI for easy navigation

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Deployment on Render

### Option 1: Using render.yaml (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. In your Render dashboard:
   - Click "New" → "Blueprint"
   - Connect your repository
   - Render will automatically detect the `render.yaml` file and configure the service

### Option 2: Manual Setup

1. Push your code to a Git repository

2. In your Render dashboard:
   - Click "New" → "Web Service"
   - Connect your repository
   - Configure the service:
     - **Name**: sitestreamer (or your preferred name)
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free or Starter (depending on your needs)

3. Click "Create Web Service"

The service will automatically deploy and be available at `https://your-app-name.onrender.com`

## How It Works

1. User accesses the frontend interface
2. Frontend loads the proxied website in an iframe
3. All requests go through the `/proxy` endpoint
4. Server fetches content from movies.do and rewrites URLs
5. Content is streamed back to the user
6. Downloads and video streaming work seamlessly through the proxy

## Technical Details

- **Backend**: Node.js with Express
- **Proxy**: Custom proxy implementation using Axios
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **URL Rewriting**: Automatic rewriting of all URLs in HTML, CSS, and JavaScript files

## Notes

- The proxy handles all HTTP methods (GET, POST, etc.)
- CORS headers are automatically set to allow cross-origin requests
- Content is buffered and rewritten before being sent to the client
- Binary content (images, videos) is streamed as-is without modification

