import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TestPhaseEndedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Beta test phase ended
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Thank you for helping test TaxDoc!
        </p>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tester accounts are free user accounts only and no longer have access
          while the test phase is closed.
        </p>
        <Button variant="primary" asChild>
          <Link href="/auth/login">Back to login</Link>
        </Button>
      </div>
    </div>
  );
}
