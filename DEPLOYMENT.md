# Deployment Guide

This guide provides instructions for deploying the application to a production environment.

## Prerequisites

- Node.js 18+ installed on the server
- MongoDB database accessible from the server
- Twitter Developer Account with API credentials
- Domain name with SSL certificate

## Environment Setup

1. Create a `.env.production` file with the following variables:

```
# Dynamic SDK Configuration
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID="your-dynamic-environment-id"

# MongoDB Connection
MONGODB_URI=your-production-mongodb-uri

# Admin Configuration
ADMIN_ACCESS_CODE="your-secure-admin-code"

# Twitter API Credentials
TWITTER_CLIENT_SECRET="your-twitter-client-secret"
TWITTER_CLIENT_ID="your-twitter-client-id"

# TinyURL API
TINY_URL_API_TOKEN="your-tiny-url-api-token"

# Production URL (IMPORTANT)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Twitter Developer Portal Configuration

1. Log in to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Navigate to your project and app settings
3. Update the callback URL to: `https://yourdomain.com/api/auth/twitter/callback`
4. Ensure your app has the following permissions:
   - `tweet.read`
   - `users.read`

## Deployment Steps

### Option 1: Manual Deployment

1. Clone the repository to your server
2. Install dependencies:
   ```
   npm install --production
   ```
3. Build the application:
   ```
   npm run prod:build
   ```
4. Start the application:
   ```
   npm run prod:start
   ```

### Option 2: Docker Deployment

1. Build the Docker image:
   ```
   docker build -t my-app:latest .
   ```
2. Run the container:
   ```
   docker run -p 3000:3000 --env-file .env.production my-app:latest
   ```

### Option 3: Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure the environment variables in the Vercel dashboard
3. Deploy the application

## Post-Deployment Verification

1. Verify Twitter authentication works by testing the login flow
2. Check that referral links are generated correctly
3. Ensure profile images are displayed properly
4. Test the entire user onboarding flow

## Troubleshooting

### Twitter Authentication Issues

- Verify the callback URL in the Twitter Developer Portal matches your production URL
- Check that the `NEXT_PUBLIC_APP_URL` environment variable is set correctly
- Ensure your Twitter API credentials are valid

### Image Loading Issues

- Confirm that `pbs.twimg.com` is included in the `remotePatterns` in `next.config.js`
- Check browser console for CORS errors

### Database Connection Issues

- Verify the MongoDB connection string is correct
- Ensure the database user has the necessary permissions
- Check network connectivity between your server and the MongoDB instance

## Maintenance

- Regularly update dependencies to patch security vulnerabilities
- Monitor application logs for errors
- Set up alerts for server health and performance metrics 