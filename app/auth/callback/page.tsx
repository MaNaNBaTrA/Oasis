'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/context/ToastContext';

export default function AuthCallback() {
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          showToast('Authentication failed. Please try again.', 'error');
          router.push('/signin');
          return;
        }

        if (data.session) {
          const user = data.session.user;
          
          const checkResponse = await fetch('/api/user/check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: user.email }),
          });

          const checkData = await checkResponse.json();

          if (!checkData.exists) {
            const createResponse = await fetch('/api/user/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: user.email,
                role: 'Individual', 
                firstName: user.user_metadata?.full_name?.split(' ')[0] || null,
                lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
              }),
            });

            const createData = await createResponse.json();

            if (!createData.success) {
              console.error('Failed to create user profile:', createData.error);
              showToast('Failed to create user profile. Please contact support.', 'error');
              router.push('/signin');
              return;
            }
          }

          showToast('Successfully signed in!', 'success');
          router.push('/'); 
        } else {
          router.push('/signin');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        showToast('Authentication failed. Please try again.', 'error');
        router.push('/signin');
      }
    };

    handleAuthCallback();
  }, [router, showToast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4 text-lg">Completing authentication...</p>
      </div>
    </div>
  );
}