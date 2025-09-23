'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/context/ToastContext';
import { User, Edit3, Save, X, Upload, Mail, Phone, MapPin, Calendar, UserCheck } from 'lucide-react';
import Image from 'next/image';

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

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    number: '',
    address: '',
    imageUrl: ''
  });

  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user?.email) {
        router.push('/signin');
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
        showToast('Failed to fetch profile', 'error');
        return;
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        setUserProfile(data.user);
        setFormData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          number: data.user.number || '',
          address: data.user.address || '',
          imageUrl: data.user.imageUrl || ''
        });
      }
    } catch (err) {
      showToast('Network error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        number: userProfile.number || '',
        address: userProfile.address || '',
        imageUrl: userProfile.imageUrl || ''
      });
    }
  };

  const handleSave = async () => {
    if (!userProfile) return;
    
    setSaving(true);
    
    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userProfile.email,
          ...formData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to update profile', 'error');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setUserProfile(data.user);
        setEditing(false);
        showToast('Profile updated successfully', 'success');
      }
    } catch (err) {
      showToast('Network error occurred', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl
    }));
    setShowImagePicker(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'error');
      return;
    }

    setUploadingImage(true);
    showToast('Uploading image...', 'info');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'Oasis-SIH');

      const response = await fetch('https://api.cloudinary.com/v1_1/dtk8xaw2d/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      handleImageSelect(data.secure_url);
      showToast('Image uploaded successfully', 'success');
    } catch (error) {
      showToast('Failed to upload image. Please try again.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageClick = () => {
    if (editing) {
      setShowImagePicker(true);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse mx-auto mb-4"></div>
          <div className="w-32 h-6 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r bg-brand h-32 relative">
            <div className="absolute -bottom-16 left-8">
              {editing ? (
                <div className="relative">
                  <div 
                    className="cursor-pointer relative"
                    onClick={handleImageClick}
                  >
                    {formData.imageUrl ? (
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white group">
                        <Image
                          src={formData.imageUrl}
                          alt="Profile"
                          fill
                          className="object-cover transition-opacity group-hover:opacity-30"
                          onError={() => handleInputChange('imageUrl', '')}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-8 h-8 text-gray-800" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white hover:bg-gray-300 transition-colors relative group">
                        <User className="w-16 h-16 text-gray-600 group-hover:opacity-30 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-8 h-8 text-gray-800" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {userProfile.imageUrl ? (
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white">
                      <Image
                        src={userProfile.imageUrl}
                        alt={getDisplayName()}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white">
                      <User className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="absolute top-4 right-4">
              {editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-full transition-colors"
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors flex items-center gap-1"
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEdit}
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="pt-20 pb-8 px-8">
            <div className="mb-8">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="input input-bordered w-full"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="input input-bordered w-full"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.number}
                      onChange={(e) => handleInputChange('number', e.target.value)}
                      className="input input-bordered w-full"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="textarea textarea-bordered w-full"
                      placeholder="Enter address"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {getDisplayName()}
                  </h1>
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="w-4 h-4 text-brand" />
                    <span className="text-brand font-medium capitalize">{userProfile.role}</span>
                  </div>
                </div>
              )}
            </div>

            {!editing && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="text-sm text-gray-500">Email</span>
                        <br />
                        <span>{userProfile.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-gray-700">
                      <UserCheck className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="text-sm text-gray-500">Role</span>
                        <br />
                        <span className="capitalize">{userProfile.role}</span>
                      </div>
                    </div>
                    
                    {userProfile.number && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-500">Phone</span>
                          <br />
                          <span>{userProfile.number}</span>
                        </div>
                      </div>
                    )}
                    
                    {userProfile.address && (
                      <div className="flex items-start gap-3 text-gray-700">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-sm text-gray-500">Address</span>
                          <br />
                          <span>{userProfile.address}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="text-sm text-gray-500">Member since</span>
                        <br />
                        <span>{formatDate(userProfile.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="text-sm text-gray-500">Last updated</span>
                        <br />
                        <span>{formatDate(userProfile.updatedAt)}</span>
                      </div>
                    </div>
                    
                    {userProfile.firstName && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-500">First Name</span>
                          <br />
                          <span>{userProfile.firstName}</span>
                        </div>
                      </div>
                    )}
                    
                    {userProfile.lastName && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-500">Last Name</span>
                          <br />
                          <span>{userProfile.lastName}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {showImagePicker && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border pointer-events-auto">
              <h3 className="text-lg font-semibold mb-4">Select Profile Picture</h3>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={uploadingImage}
                  />
                  <label 
                    htmlFor="file-upload" 
                    className={`cursor-pointer flex flex-col items-center ${uploadingImage ? 'opacity-50' : ''}`}
                  >
                    {uploadingImage ? (
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {uploadingImage ? 'Uploading...' : 'Choose from gallery'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG up to 5MB
                    </span>
                  </label>
                </div>

                <div className="text-center">
                  <span className="text-sm text-gray-500">or</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paste image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="input input-bordered w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value) {
                          handleImageSelect(value);
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => setShowImagePicker(false)}
                  className="btn btn-outline"
                  disabled={uploadingImage}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleImageSelect('')}
                  className="btn btn-error"
                  disabled={uploadingImage}
                >
                  Remove Image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}