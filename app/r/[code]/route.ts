import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UrlTracking from '@/models/UrlTracking';

export async function GET(
    request: Request,
    { params }: { params: { code: string } }
) {
    try {
        const code = params.code;
        console.log('Redirect requested for code:', code);
        
        await dbConnect();
        
        // Find the URL in the database
        const urlTracking = await UrlTracking.findOne({ shortCode: code });
        console.log('URL tracking found:', urlTracking);
        
        if (!urlTracking) {
            console.log('URL not found for code:', code);
            return new Response('URL not found', { status: 404 });
        }
        
        // Increment the click count
        urlTracking.clicks += 1;
        await urlTracking.save();
        
        console.log('Redirecting to:', urlTracking.originalUrl);
        // Redirect to the original URL
        return NextResponse.redirect(urlTracking.originalUrl);
        
    } catch (error) {
        console.error('Error handling redirect:', error);
        return new Response('Server error', { status: 500 });
    }
} 