'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function ReferralsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Referrals</h1>
      <p>This is the referrals page. Content will be added soon.</p>
    </div>
  );
} 