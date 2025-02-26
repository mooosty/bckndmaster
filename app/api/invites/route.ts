import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import UrlTracking from '@/models/UrlTracking';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const headersList = headers();
        const authorization = headersList.get('authorization');
        
        console.log('Received authorization header:', authorization);
        
        if (!authorization?.startsWith('Bearer ')) {
            console.log('Invalid authorization format - missing Bearer prefix');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = authorization.split('Bearer ')[1];
        
        console.log('Extracted user ID from authorization:', userId);
        
        if (!userId) {
            console.log('No user ID found in authorization header');
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        await dbConnect();
        console.log('Connected to database');

        // Use the correct base URL based on environment
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (!baseUrl) {
            console.warn('NEXT_PUBLIC_APP_URL environment variable is not set. Using localhost as fallback.');
            if (process.env.NODE_ENV === 'production') {
                console.error('CRITICAL: Missing NEXT_PUBLIC_APP_URL in production environment! This will affect Twitter authentication and referral links.');
            }
        }
        const appUrl = baseUrl || 'http://localhost:3000';
        const LONG_URL = `${appUrl}/?referral=${userId}`;
        
        console.log('Creating referral link for:', {
            userId,
            LONG_URL,
            appUrl
        });
        
        // First check our database
        let urlTracking = await UrlTracking.findOne({ originalUrl: LONG_URL });
        
        if (urlTracking) {
            console.log('Found URL in database:', urlTracking);
            
            // Check if it has a shortCode - if not, add one
            if (!urlTracking.shortCode) {
                const shortCode = generateShortCode(userId);
                const shortUrl = `${appUrl}/r/${shortCode}`;
                
                urlTracking.shortCode = shortCode;
                urlTracking.tinyUrl = shortUrl;
                await urlTracking.save();
                
                console.log('Updated existing URL with shortCode:', urlTracking);
            }
            
            return NextResponse.json({
                referralUrl: urlTracking.tinyUrl,
                shortCode: urlTracking.shortCode,
                source: 'database'
            });
        }

        // Generate a short code for the URL
        const shortCode = generateShortCode(userId);
        const shortUrl = `${appUrl}/r/${shortCode}`;
        
        console.log('Generated short URL:', {
            shortCode,
            shortUrl
        });
        
        // Store in database
        urlTracking = new UrlTracking({
            originalUrl: LONG_URL,
            tinyUrl: shortUrl,
            shortCode: shortCode,
            clicks: 0
        });
        
        await urlTracking.save();
        console.log('Saved URL tracking:', urlTracking);
        
        return NextResponse.json({
            referralUrl: shortUrl,
            shortCode: shortCode,
            source: 'generated'
        });

    } catch (error: any) {
        console.error('Error in invites API:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to generate link'
        }, { status: 500 });
    }
}

// Generate a short code based on the user ID
function generateShortCode(userId: string): string {
    // Create a hash of the user ID
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    
    // Take the first 6 characters of the hash
    return hash.substring(0, 6);
} 