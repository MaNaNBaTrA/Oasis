'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/context/ToastContext';

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  number?: string;
  address?: string;
  imageUrl?: string;
  role: 'Worker' | 'Individual';
  createdAt: string;
  updatedAt: string;
}

const Page = () => {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          router.push('/signin');
          return;
        }

        if (!user) {
          router.push('/signin');
          return;
        }

        setUser(user);

        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: user.email }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserData(data.user);
          }
        } else {
          showToast('Failed to load user profile', 'error');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        showToast('Error loading user data', 'error');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router, showToast]);

  const handleSignOut = async () => {
    setSignOutLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        showToast('Failed to sign out', 'error');
      } else {
        showToast('Successfully signed out', 'success');
        router.push('/signin');
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      showToast('An error occurred during sign out', 'error');
    } finally {
      setSignOutLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="navbar bg-base-100 rounded-lg shadow-lg mb-6">
          <div className="navbar-start">
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <div className="navbar-end">
            <button
              className="btn btn-outline btn-error"
              onClick={handleSignOut}
              disabled={signOutLoading}
            >
              {signOutLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              )}
              {signOutLoading ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <div className="flex items-center gap-4 mb-4">
              <div className="avatar">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-content text-2xl font-bold">
                  {userData?.firstName ? userData.firstName[0].toUpperCase() : userData?.email[0].toUpperCase()}
                </div>
              </div>
              <div>
                <h2 className="card-title text-2xl">
                  {userData?.firstName && userData?.lastName 
                    ? `${userData.firstName} ${userData.lastName}`
                    : 'Welcome!'
                  }
                </h2>
                <div className="badge badge-primary badge-lg">
                  {userData?.role || 'User'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title mb-4">Account Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-base-content/70">Email</label>
                  <p className="text-lg">{userData?.email || user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Role</label>
                  <p className="text-lg">{userData?.role || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Account Created</label>
                  <p className="text-lg">
                    {userData?.createdAt ? formatDate(userData.createdAt) : 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Last Updated</label>
                  <p className="text-lg">
                    {userData?.updatedAt ? formatDate(userData.updatedAt) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h3 className="card-title">Personal Information</h3>
                <button className="btn btn-sm btn-outline">Edit Profile</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-base-content/70">First Name</label>
                  <p className="text-lg">{userData?.firstName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Last Name</label>
                  <p className="text-lg">{userData?.lastName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Phone Number</label>
                  <p className="text-lg">{userData?.number || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Address</label>
                  <p className="text-lg">{userData?.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg mt-6">
          <div className="card-body">
            <h3 className="card-title mb-4">Authentication Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-base-content/70">User ID</label>
                <p className="text-sm font-mono bg-base-200 p-2 rounded">
                  {user?.id}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-base-content/70">Auth Provider</label>
                <p className="text-lg capitalize">
                  {user?.app_metadata?.provider || 'Email'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-base-content/70">Email Confirmed</label>
                <div className="flex items-center gap-2">
                  {user?.email_confirmed_at ? (
                    <>
                      <div className="badge badge-success">Verified</div>
                      <span className="text-sm">{formatDate(user.email_confirmed_at)}</span>
                    </>
                  ) : (
                    <div className="badge badge-warning">Pending Verification</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg mt-6">
          <div className="card-body">
            <h3 className="card-title mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button className="btn btn-primary">
                Update Profile
              </button>
              <button className="btn btn-secondary">
                Change Password
              </button>
              <button className="btn btn-accent">
                Account Settings
              </button>
              {!user?.email_confirmed_at && (
                <button className="btn btn-warning">
                  Resend Verification Email
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;