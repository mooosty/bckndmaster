import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#2a2a28] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-display text-[#f5efdb] mb-4">404</h1>
        <p className="text-[#f5efdb99] mb-8">Page not found</p>
        <Link
          href="/admin/dashboard"
          className="px-6 py-3 bg-[#f5efdb] text-[#2a2a28] rounded-lg hover:opacity-90 inline-block"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
} 