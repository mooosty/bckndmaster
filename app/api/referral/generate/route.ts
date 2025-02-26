import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import UrlTracking from '@/models/UrlTracking';

export async function POST(req: Request) {
    try {
        const headersList = headers();
        const authorization = headersList.get('authorization');
        
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = authorization.split('Bearer ')[1];
        
        if (!userEmail) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        try {
            await dbConnect();
        } catch (dbError) {
            console.error('Database connection error:', dbError);
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Generate referral link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (!baseUrl) {
            console.warn('NEXT_PUBLIC_APP_URL environment variable is not set. Using localhost as fallback.');
            if (process.env.NODE_ENV === 'production') {
                console.error('CRITICAL: Missing NEXT_PUBLIC_APP_URL in production environment! This will affect Twitter authentication and referral links.');
            }
        }
        const appUrl = baseUrl || 'http://localhost:3000';
        const originalUrl = `${appUrl}/dashboard?ref=${encodeURIComponent(userEmail)}`;

        try {
            // Create or update URL tracking
            const urlTracking = await UrlTracking.findOneAndUpdate(
                { originalUrl },
                {
                    originalUrl,
                    tinyUrl: originalUrl, // Will be updated with TinyURL response
                    $setOnInsert: { clicks: 0 }
                },
                { upsert: true, new: true }
            );

            // Create short URL using TinyURL API
            const response = await fetch('https://api.tinyurl.com/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.TINY_URL_API_TOKEN}`
                },
                body: JSON.stringify({
                    url: originalUrl,
                    domain: "tiny.one"
                })
            });

            const responseText = await response.text();
            console.log('TinyURL API Response:', {
                status: response.status,
                body: responseText
            });

            if (!response.ok) {
                throw new Error(`TinyURL API error: ${response.status} - ${responseText}`);
            }

            const data = JSON.parse(responseText);
            
            // Update the URL tracking with the TinyURL
            await UrlTracking.findByIdAndUpdate(urlTracking._id, {
                tinyUrl: data.data.tiny_url
            });

            return NextResponse.json({ referralUrl: data.data.tiny_url });
        } catch (error) {
            console.error('Error details:', {
                error,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            // Fallback to original URL if anything fails
            return NextResponse.json({ referralUrl: originalUrl });
        }
    } catch (error: any) {
        console.error('Error in referral generation:', {
            error,
            message: error.message,
            stack: error.stack
        });
        return NextResponse.json({ 
            error: error.message || 'Failed to generate referral link',
            details: error.toString()
        }, { status: 500 });
    }
} 