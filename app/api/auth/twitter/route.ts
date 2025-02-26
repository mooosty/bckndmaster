import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/src/models/User';
import crypto from 'crypto';

// Twitter OAuth configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`;

// Twitter OAuth endpoints
const TWITTER_OAUTH_URL = 'https://twitter.com/i/oauth2/authorize';
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const TWITTER_USER_URL = 'https://api.twitter.com/2/users/me';

// Generate PKCE code verifier and challenge
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const isOnboarding = url.searchParams.get('onboarding') === 'true';
    
    console.log('Twitter auth GET request received:', {
      url: request.url,
      isOnboarding,
      params: Object.fromEntries(url.searchParams.entries())
    });
    
    // Generate PKCE values
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    
    // Generate random state for security
    const state = crypto.randomBytes(16).toString('hex');
    
    // Add onboarding parameter to redirect URI if needed
    const redirectUri = isOnboarding 
      ? `${REDIRECT_URI}?onboarding=true` 
      : REDIRECT_URI;
    
    console.log('Using redirect URI:', redirectUri);
    
    // Create the authorization URL with all parameters
    const authUrl = new URL(TWITTER_OAUTH_URL);
    authUrl.search = new URLSearchParams({
      response_type: 'code',
      client_id: TWITTER_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'tweet.read users.read',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    }).toString();
    
    console.log('Redirecting to Twitter auth URL:', authUrl.toString());
    
    // Store state and code verifier in cookies for verification
    const response = NextResponse.redirect(authUrl);
    
    // Set cookies with appropriate security flags
    response.cookies.set('twitter_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });

    response.cookies.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });

    return response;
  } catch (error) {
    console.error('Twitter auth error:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate Twitter authentication',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { code, state, isOnboarding } = await request.json();
    
    // Verify state from cookie
    const storedState = request.cookies.get('twitter_oauth_state')?.value;
    const codeVerifier = request.cookies.get('twitter_code_verifier')?.value;

    // In production, log less detailed information
    if (process.env.NODE_ENV === 'production') {
      console.log('Received Twitter auth POST request');
    } else {
      console.log('Received POST request with:', { 
        code: !!code, 
        state, 
        storedState, 
        codeVerifier: !!codeVerifier,
        isOnboarding
      });
    }

    if (!storedState || !codeVerifier || storedState !== state) {
      console.error('State or code verifier mismatch');
      return NextResponse.json({ error: 'Invalid state parameter or missing code verifier' }, { status: 400 });
    }
    
    // Determine the correct redirect URI based on the isOnboarding flag from the request body
    // This must match EXACTLY what was used in the initial authorization request
    const redirectUri = isOnboarding 
      ? `${REDIRECT_URI}?onboarding=true` 
      : REDIRECT_URI;

    if (process.env.NODE_ENV !== 'production') {
      console.log('Using redirect URI for token exchange:', redirectUri);
    }

    // Exchange code for access token using PKCE
    try {
      // Use URLSearchParams to properly format the request body
      const tokenParams = new URLSearchParams();
      tokenParams.append('grant_type', 'authorization_code');
      tokenParams.append('code', code);
      tokenParams.append('redirect_uri', redirectUri);
      tokenParams.append('code_verifier', codeVerifier);
      tokenParams.append('client_id', TWITTER_CLIENT_ID);

      console.log('Token request params:', Object.fromEntries(tokenParams.entries()));
      
      // Create the Authorization header with Basic auth
      const authHeader = `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`;
      console.log('Using auth header (first 20 chars):', authHeader.substring(0, 20) + '...');
      
      const tokenResponse = await fetch(TWITTER_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader
        },
        body: tokenParams
      });

      // Log the response status for debugging
      console.log('Token response status:', tokenResponse.status);
      
      // Try to parse the response as JSON
      let tokenData;
      try {
        tokenData = await tokenResponse.json();
      } catch (e) {
        // If JSON parsing fails, try to get the text response
        const textResponse = await tokenResponse.text();
        console.error('Failed to parse token response as JSON:', textResponse);
        throw new Error(`Non-JSON response: ${textResponse}`);
      }
      
      if (!tokenResponse.ok) {
        console.error('Token error response:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          data: tokenData
        });
        throw new Error(tokenData.error || `Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText}`);
      }

      console.log('Token exchange successful, received token data');

      // Get user info from Twitter
      const userResponse = await fetch(`${TWITTER_USER_URL}?user.fields=profile_image_url,description`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      });

      const userData = await userResponse.json();
      if (!userResponse.ok) {
        console.error('User info error:', userData);
        throw new Error(userData.error || 'Failed to get user info');
      }

      console.log('Retrieved Twitter user data:', { 
        id: userData.data.id, 
        username: userData.data.username,
        hasProfileImage: !!userData.data.profile_image_url,
        hasBio: !!userData.data.description
      });

      // Process the profile image URL to get full-size image by removing _normal suffix
      let profileImageUrl = userData.data.profile_image_url || '';
      if (profileImageUrl && profileImageUrl.includes('_normal.')) {
        profileImageUrl = profileImageUrl.replace('_normal.', '.');
        console.log('Converted to full-size profile image:', profileImageUrl);
      }

      // Get user from auth header
      const userAuthHeader = request.headers.get('authorization');
      if (!userAuthHeader?.startsWith('Bearer ')) {
        console.error('Missing or invalid auth header');
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const userEmail = userAuthHeader.split(' ')[1];
      if (!userEmail || !userEmail.includes('@')) {
        console.error('Invalid email in auth token:', userEmail);
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }

      console.log('Updating user with Twitter data:', { email: userEmail, twitterId: userData.data.id });

      // Update user with Twitter credentials
      const user = await User.findOne({ email: userEmail });
      
      // Prepare update data
      const updateData: any = {
        twitter: {
          accessToken: tokenData.access_token,
          username: userData.data.username,
          id: userData.data.id,
          verified: true,
          lastVerified: new Date(),
          profileImageUrl: profileImageUrl,
          bio: userData.data.description || ''
        }
      };
      
      // Add refresh token if available
      if (tokenData.refresh_token) {
        updateData.twitter.refreshToken = tokenData.refresh_token;
      }
      
      // Only set profile_image if user doesn't already have one
      if (profileImageUrl && (!user || !user.profile_image)) {
        updateData.profile_image = profileImageUrl;
      }
      
      const updatedUser = await User.findOneAndUpdate(
        { email: userEmail },
        updateData,
        { new: true, upsert: true }
      );

      if (!updatedUser) {
        console.error('User not found after update');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      console.log('User updated successfully with Twitter data');

      // Clear the oauth cookies
      const response = NextResponse.json({
        success: true,
        twitter: {
          username: userData.data.username,
          verified: true,
          profileImageUrl: profileImageUrl,
          bio: userData.data.description || ''
        }
      });

      response.cookies.delete('twitter_oauth_state');
      response.cookies.delete('twitter_code_verifier');

      return response;
    } catch (tokenError: unknown) {
      const errorMessage = tokenError instanceof Error ? tokenError.message : String(tokenError);
      
      if (process.env.NODE_ENV === 'production') {
        console.error('Token exchange error occurred');
      } else {
        console.error('Token exchange error:', tokenError);
      }
      
      return NextResponse.json({ 
        error: `Token exchange failed: ${errorMessage}`,
        details: process.env.NODE_ENV !== 'production' && tokenError instanceof Error ? 
          tokenError.stack : 'An error occurred during authentication'
      }, { status: 500 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('Twitter auth error occurred');
    } else {
      console.error('Twitter auth error:', error);
    }
    
    return NextResponse.json({ 
      error: `Failed to authenticate with Twitter: ${process.env.NODE_ENV === 'production' ? 'Please try again later' : errorMessage}`,
      details: process.env.NODE_ENV !== 'production' && error instanceof Error ? 
        error.stack : 'An error occurred during authentication'
    }, { status: 500 });
  }
} 