import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import User from '@/src/models/User';
import Invite from '@/models/Invite';
import mongoose from 'mongoose';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, referralId } = body;

        console.log('Onboarding completion referral API called with:', { email, referralId });

        if (!email) {
            console.log('Email is required but not provided');
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        if (!referralId) {
            console.log('ReferralId is required but not provided');
            return NextResponse.json({ error: 'ReferralId is required' }, { status: 400 });
        }

        await connectDB();
        console.log('Connected to database');

        // Find the user who completed onboarding
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found:', email);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        console.log('User found:', { userId: user._id, email: user.email, onboardingCompleted: user.onboarding_completed });

        // Verify that onboarding is completed
        if (!user.onboarding_completed) {
            console.log('User has not completed onboarding:', email);
            return NextResponse.json({ error: 'User has not completed onboarding' }, { status: 400 });
        }

        // Find the referrer user - try different methods since referralId might be in different formats
        let referrer = null;
        
        // First try to find by MongoDB ObjectId (if it's a valid ObjectId)
        if (mongoose.isValidObjectId(referralId)) {
            console.log('Trying to find referrer by ObjectId:', referralId);
            referrer = await User.findById(referralId);
            console.log('Referrer found by ObjectId?', !!referrer);
        }
        
        // If not found and it looks like a UUID, try to find by dynamic ID
        if (!referrer && referralId.includes('-')) {
            console.log('Trying to find referrer by dynamic ID:', referralId);
            referrer = await User.findOne({ 'dynamicId': referralId });
            console.log('Referrer found by dynamic ID?', !!referrer);
            
            // Debug: List all users with dynamicId
            const allUsersWithDynamicId = await User.find({ dynamicId: { $exists: true } }).select('email dynamicId');
            console.log('All users with dynamicId:', allUsersWithDynamicId.map(u => ({ email: u.email, dynamicId: u.dynamicId })));
        }
        
        // If not found and it looks like a wallet address (0x...), try to find by wallet address
        if (!referrer && referralId.startsWith('0x')) {
            console.log('Trying to find referrer by wallet address:', referralId);
            referrer = await User.findOne({ 'dynamicId': referralId });
            console.log('Referrer found by wallet address?', !!referrer);
        }
        
        // As a last resort, try to find by email if the referralId looks like an email
        if (!referrer && referralId.includes('@')) {
            console.log('Trying to find referrer by email:', referralId);
            referrer = await User.findOne({ email: referralId });
            console.log('Referrer found by email?', !!referrer);
        }
        
        console.log('Referrer found:', referrer ? { id: referrer._id, email: referrer.email } : 'Not found');
        
        if (!referrer) {
            console.log(`Referrer with ID ${referralId} not found after trying multiple lookup methods`);
            return NextResponse.json({ error: 'Referrer not found' }, { status: 404 });
        }

        // Check if this referral has already been processed
        const existingInvite = await Invite.findOne({ 
            invitedUser: user._id,
            inviteUser: referrer._id
        });

        console.log('Existing invite found?', !!existingInvite);

        if (existingInvite) {
            console.log('Referral already processed for this user');
            return NextResponse.json({ success: true, message: 'Referral already processed' });
        }

        try {
            // Create an invite record
            const invite = await Invite.create({
                invitedUser: user._id,
                inviteUser: referrer._id
            });
            console.log('Invite record created:', invite._id);
            
            // Award points to the referrer (100 points for direct referral)
            // Update both points and winwin_balance
            const updatedReferrer = await User.findByIdAndUpdate(
                referrer._id,
                { 
                    $inc: { 
                        points: 100,
                        winwin_balance: 100 
                    } 
                },
                { new: true }
            );

            if (updatedReferrer) {
                console.log(`Awarded 100 points to referrer ${referrer.email}, new points:`, updatedReferrer.points);
                console.log(`Updated winwin_balance for referrer ${referrer.email}, new balance:`, updatedReferrer.winwin_balance);
            } else {
                console.log(`Failed to update referrer ${referrer.email} - user may have been deleted`);
            }
            
            // Check for second-level referrer (20 points)
            const secondLevelInvite = await Invite.findOne({ invitedUser: referrer._id });
            if (secondLevelInvite) {
                console.log('Found second-level referrer:', secondLevelInvite.inviteUser);
                const updatedSecondLevel = await User.findByIdAndUpdate(
                    secondLevelInvite.inviteUser,
                    { 
                        $inc: { 
                            points: 20,
                            winwin_balance: 20 
                        } 
                    },
                    { new: true }
                );
                
                if (updatedSecondLevel) {
                    console.log(`Awarded 20 points to second-level referrer, new points:`, updatedSecondLevel.points);
                    console.log(`Updated winwin_balance for second-level referrer, new balance:`, updatedSecondLevel.winwin_balance);
                } else {
                    console.log(`Failed to update second-level referrer - user may have been deleted`);
                }
                
                // Check for third-level referrer (10 points)
                const thirdLevelInvite = await Invite.findOne({ invitedUser: secondLevelInvite.inviteUser });
                if (thirdLevelInvite) {
                    console.log('Found third-level referrer:', thirdLevelInvite.inviteUser);
                    const updatedThirdLevel = await User.findByIdAndUpdate(
                        thirdLevelInvite.inviteUser,
                        { 
                            $inc: { 
                                points: 10,
                                winwin_balance: 10 
                            } 
                        },
                        { new: true }
                    );
                    
                    if (updatedThirdLevel) {
                        console.log(`Awarded 10 points to third-level referrer, new points:`, updatedThirdLevel.points);
                        console.log(`Updated winwin_balance for third-level referrer, new balance:`, updatedThirdLevel.winwin_balance);
                    } else {
                        console.log(`Failed to update third-level referrer - user may have been deleted`);
                    }
                }
            }

            return NextResponse.json({ success: true });
        } catch (inviteError) {
            console.error('Error processing invite:', inviteError);
            return NextResponse.json({ error: 'Error processing invite' }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error in onboarding completion referral process:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 