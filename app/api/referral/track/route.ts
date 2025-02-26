import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UrlTracking from '@/models/UrlTracking';

export async function POST(req: Request) {
    try {
        const { refId } = await req.json();

        if (!refId) {
            return NextResponse.json({ error: 'Invalid request - missing refId' }, { status: 400 });
        }

        await dbConnect();

        // Track the referral click by incrementing the click count
        // Find the URL tracking record for this referral
        const urlTracking = await UrlTracking.findOne({ 
            originalUrl: { $regex: `referral=${refId}` } 
        });

        if (urlTracking) {
            // Increment the click count
            urlTracking.clicks += 1;
            await urlTracking.save();
            console.log(`Referral click tracked for refId: ${refId}, new count: ${urlTracking.clicks}`);
        } else {
            console.log(`No URL tracking record found for refId: ${refId}`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in referral tracking:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 