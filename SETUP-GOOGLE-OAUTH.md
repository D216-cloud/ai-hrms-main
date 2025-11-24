# Google OAuth Setup for HRMS

This document explains how to set up and use Google OAuth authentication for the HRMS system.

## Prerequisites

1. Google OAuth credentials (Client ID and Client Secret)
2. A Google account with access to Google Cloud Console
3. The HRMS application running locally or deployed

## Setup Instructions

### 1. Configure Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add the following authorized redirect URIs:
   - For local development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.com/api/auth/callback/google`
7. Save the credentials and note the Client ID and Client Secret

### 2. Update Environment Variables

Add the following to your `.env.local` file:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 3. Add Users to the HR System

Since this is an internal HR system, only pre-approved users can access it. To add a Google user:

1. Run the script to add a user:
   ```bash
   node add-google-user.js user@example.com "Full Name" hr
   ```
   
2. For admin users:
   ```bash
   node add-google-user.js admin@example.com "Admin Name" admin
   ```

### 4. Testing Google Authentication

1. Start your HRMS application:
   ```bash
   npm run dev
   ```

2. Navigate to the sign-in page: `http://localhost:3000/auth/signin`

3. Click the "Sign in with Google" button

4. Select or enter your Google account credentials

5. If you've been added to the system, you'll be redirected to the dashboard

## How It Works

1. When a user signs in with Google, the system checks if their email exists in the `hr_users` table
2. If the user exists and is active, they're granted access based on their role
3. If the user doesn't exist or is inactive, they're redirected to the sign-in page with an error message

## Troubleshooting

### "You don't have permission to access the HR portal" Error

This error occurs when:
1. The Google user's email is not in the `hr_users` table
2. The user account is marked as inactive

Solution:
- Ensure the user has been added to the system using the `add-google-user.js` script
- Check that the user account is active in the database

### Invalid Client ID Error

This error occurs when:
1. The Google Client ID is incorrect
2. The redirect URI is not properly configured in Google Cloud Console

Solution:
- Verify the Client ID in your `.env.local` file
- Check that the redirect URIs in Google Cloud Console match your application URLs

## Security Notes

- Google OAuth provides a secure authentication mechanism
- Only pre-approved users can access the HR system
- User roles are enforced both at sign-in and through middleware protection
- Password hashes are not used for Google users but are required for database schema compliance