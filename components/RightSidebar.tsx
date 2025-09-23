'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User, ChevronDown, Settings, LogOut, Shield } from 'lucide-react';
import Image from 'next/image';
import Animation from '@/components/Animation'
import Trash from '@/public/Trash.json'

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  number?: string;
  address?: string;
  imageUrl?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function RightSidebar() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
          setError('Authentication error');
          setLoading(false);
          return;
        }

        if (!user?.email) {
          setError('No user found');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: user.email }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch profile');
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.success && data.user) {
          setUserProfile(data.user);
        } else {
          setError('Invalid response data');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const getDisplayName = () => {
    if (!userProfile) return 'User';

    const firstName = userProfile.firstName?.trim();
    const lastName = userProfile.lastName?.trim();

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return userProfile.email.split('@')[0];
    }
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setShowDropdown(false);
  };

  const handleSettingsClick = () => {
    router.push('/settings');
    setShowDropdown(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
    setShowDropdown(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'worker':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'individual':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-nav p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-nav p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Profile unavailable</span>
              <p className="text-xs text-gray-400">Please try again</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="w-full h-full bg-nav p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Loading profile...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-nav">
      <div className="p-4">
        <div className="relative">
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-black/5 rounded-xl p-3 -m-1 transition-all duration-200 group"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                {userProfile.imageUrl ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <Image
                      src={userProfile.imageUrl}
                      alt={getDisplayName()}
                      fill
                      className="object-cover"
                      onError={() => {
                        setUserProfile(prev => prev ? { ...prev, imageUrl: undefined } : null);
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base-content truncate text-sm">
                  {getDisplayName()}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(userProfile.role)}`}>
                    <Shield className="w-3 h-3" />
                    {userProfile.role}
                  </span>
                </div>
              </div>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-base-content/60 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
              strokeWidth={2.5}
            />
          </div>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="py-1">
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>View Profile</span>
                </button>

                <button
                  onClick={handleSettingsClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>

                <div className="border-t border-gray-100 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}


        </div>
      </div>
      <div className='absolute bottom-0 w-full items-center flex justify-center'>
        <Animation
          animationData={Trash}
          width={200}
          height={200}
        />
      </div>
    </div>
  );
}