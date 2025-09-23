"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '../../context/ToastContext';

const LogoutPage = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDialog, setShowDialog] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { showToast } = useToast();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        showToast('Failed to logout. Please try again.', 'error');
        setIsLoggingOut(false);
        return;
      }
      
      showToast('Successfully logged out!', 'success');
      
      setTimeout(() => {
        router.push('/signin');
      }, 1000);
      
    } catch (error) {
      showToast('An unexpected error occurred', 'error');
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    router.back();
  };

  if (!showDialog) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ left: '20%', right: '20%' }}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200">
        <div className="flex items-center mb-4">
          <div className="bg-red-100 rounded-full p-2 mr-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Confirm Logout</h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to logout? You will need to sign in again to access your account.
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isLoggingOut}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoggingOut ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging out...
              </>
            ) : (
              'Logout'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;