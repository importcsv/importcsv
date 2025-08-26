'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = 'An error occurred during authentication';
  
  switch (error) {
    case 'Configuration':
      errorMessage = 'There is a problem with the server configuration.';
      break;
    case 'AccessDenied':
      errorMessage = 'You do not have permission to sign in.';
      break;
    case 'Verification':
      errorMessage = 'The verification token has expired or has already been used.';
      break;
    case 'OAuthSignin':
      errorMessage = 'Error occurred while trying to sign in with OAuth provider.';
      break;
    case 'OAuthCallback':
      errorMessage = 'Error occurred during OAuth callback.';
      break;
    case 'OAuthCreateAccount':
      errorMessage = 'Could not create OAuth provider user in the database.';
      break;
    case 'EmailCreateAccount':
      errorMessage = 'Could not create email provider user in the database.';
      break;
    case 'Callback':
      errorMessage = 'Error occurred in the OAuth callback handler route.';
      break;
    case 'Default':
    default:
      errorMessage = 'Unable to sign in. Please try again.';
      break;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-red-600">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-center">
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            If this problem persists, please contact support.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/signin">
            <Button>
              Try Again
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}