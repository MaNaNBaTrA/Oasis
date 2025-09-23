'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { reverseGeocode } from '@/lib/geocoding';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/context/ToastContext';
import { IApiResponse, IGarbageReport } from '@/types';
import { MapPin, Target, Navigation, AlertTriangle } from 'lucide-react';
import ManualLocationPicker from '@/components/LocationPicker';

interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy: number;
  source: 'gps' | 'network' | 'passive';
  timestamp: number;
}

interface ReportFormProps {
  onSuccess?: (report: IGarbageReport) => void;
}

interface FormData {
  image: File | null;
  city: string;
}

const ReportForm: React.FC<ReportFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    image: null,
    city: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });
  const [manualLocation, setManualLocation] = useState<LocationInfo | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const { location, error: locationError, loading: locationLoading, getCurrentLocation, getHighAccuracyLocation } = useGeolocation();
  const { showToast } = useToast();

  const currentLocation = manualLocation || location;

  const getAccuracyInfo = (accuracy?: number) => {
    if (accuracy === undefined || accuracy === null) {
      return { 
        level: 'unknown', 
        color: 'text-gray-500 bg-gray-50', 
        text: 'Unknown accuracy', 
        icon: MapPin,
        warning: false 
      };
    }

    const roundedAccuracy = Math.round(accuracy);

    if (accuracy <= 10) return {
      level: 'excellent',
      color: 'text-green-700 bg-green-50',
      text: `Excellent GPS (±${roundedAccuracy}m)`,
      icon: Target,
      warning: false
    };
    if (accuracy <= 50) return {
      level: 'very-good',
      color: 'text-green-600 bg-green-50',
      text: `Very Good (±${roundedAccuracy}m)`,
      icon: Target,
      warning: false
    };
    if (accuracy <= 100) return {
      level: 'good',
      color: 'text-blue-600 bg-blue-50',
      text: `Good (±${roundedAccuracy}m)`,
      icon: Navigation,
      warning: false
    };
    if (accuracy <= 200) return {
      level: 'fair',
      color: 'text-yellow-600 bg-yellow-50',
      text: `Fair (±${roundedAccuracy}m)`,
      icon: MapPin,
      warning: true
    };
    return {
      level: 'poor',
      color: 'text-red-600 bg-red-50',
      text: `Poor accuracy (±${roundedAccuracy}m)`,
      icon: AlertTriangle,
      warning: true
    };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        showToast('Image selected successfully', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationCapture = async () => {
    showToast('Getting your location...', 'info');
    getCurrentLocation();
  };

  const handleHighAccuracyLocation = async () => {
    showToast('Getting high-accuracy location. This may take longer but will be more precise.', 'info');
    getHighAccuracyLocation();
  };

  const handleManualLocation = () => {
    setShowManualEntry(true);
  };

  const handleMapLocationSelect = (location: LocationInfo) => {
    setManualLocation(location);
    setShowMapPicker(false);
    showToast('Location selected from map successfully', 'success');
    
    reverseGeocode(location.latitude, location.longitude)
      .then(addr => {
        setAddress(addr);
        if (addr !== 'Address unavailable') {
          showToast('Address resolved successfully', 'success');
        }
      })
      .catch(() => {
        setAddress('Address unavailable');
        showToast('Could not resolve address, but coordinates are saved', 'warning');
      });
  };

  const handleShowMapPicker = () => {
    setShowMapPicker(true);
  };

  const handleManualSubmit = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showToast('Please enter valid coordinates (latitude: -90 to 90, longitude: -180 to 180)', 'error');
      return;
    }
    
    const newManualLocation: LocationInfo = {
      latitude: lat,
      longitude: lng,
      accuracy: 10,
      source: 'passive',
      timestamp: Date.now()
    };
    
    setManualLocation(newManualLocation);
    setShowManualEntry(false);
    setManualCoords({ lat: '', lng: '' });
    showToast('Manual location set successfully', 'success');
    
    reverseGeocode(lat, lng)
      .then(addr => {
        setAddress(addr);
        if (addr !== 'Address unavailable') {
          showToast('Address resolved successfully', 'success');
        }
      })
      .catch(() => {
        setAddress('Address unavailable');
        showToast('Could not resolve address, but coordinates are saved', 'warning');
      });
  };

  React.useEffect(() => {
    if (currentLocation && !manualLocation) {
      if (currentLocation.accuracy > 1000) {
        showToast(`Location accuracy is very poor (±${Math.round(currentLocation.accuracy)}m). Please try moving outside or use manual location entry.`, 'error');
        return;
      }

      const accuracyInfo = getAccuracyInfo(currentLocation.accuracy);
      
      if (accuracyInfo.warning) {
        showToast(`Location captured with ${accuracyInfo.text}. Consider moving to an open area for better accuracy.`, 'warning');
      } else {
        showToast(`Location captured with ${accuracyInfo.text}`, 'success');
      }

      reverseGeocode(currentLocation.latitude, currentLocation.longitude)
        .then((addr) => {
          setAddress(addr);
        })
        .catch(() => {
          setAddress('Address unavailable');
        });
    }
  }, [currentLocation, manualLocation, showToast]);

  React.useEffect(() => {
    if (locationError) {
      showToast(locationError, 'error');
    }
  }, [locationError, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image || !currentLocation || !formData.city.trim()) {
      showToast('Please fill in all required fields and capture your location', 'error');
      return;
    }

    const accuracyInfo = getAccuracyInfo(currentLocation.accuracy);
    if (currentLocation.accuracy && currentLocation.accuracy > 500) {
      showToast('Location accuracy is very poor. Please try again in an open area for better results.', 'warning');
    }

    setLoading(true);
    
    try {
      showToast('Uploading image...', 'info');
      const imageUrl = await uploadToCloudinary(formData.image);
      
      showToast('Getting user information...', 'info');
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      showToast('Submitting report...', 'info');
      const reportData = {
        image: imageUrl,
        location: {
          latitude: parseFloat(currentLocation.latitude.toFixed(8)),
          longitude: parseFloat(currentLocation.longitude.toFixed(8))
        },
        accuracy: currentLocation.accuracy,
        locationSource: currentLocation.source === 'gps' ? 'gps' : currentLocation.source === 'passive' ? 'manual' : 'network',
        city: formData.city.trim(),
        address: address || undefined,
        reportedBy: session?.user?.id || undefined,
        userEmail: session?.user?.email || undefined,
        userId: session?.user?.id || undefined,
      };

      const response = await fetch('/api/garbage-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      const data: IApiResponse<{ report: IGarbageReport }> = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setFormData({ image: null, city: '' });
      setImagePreview('');
      setAddress('');
      setManualLocation(null);
      
      showToast('Report submitted successfully! 🎉', 'success');
      
      if (onSuccess && data.data?.report) {
        onSuccess(data.data.report);
      }

    } catch (error) {
      console.error('Error submitting report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit report';
      showToast(`Failed to submit report: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const accuracyInfo = currentLocation ? getAccuracyInfo(currentLocation.accuracy) : null;
  const AccuracyIcon = accuracyInfo?.icon || MapPin;

  return (
    <>
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          📝 Report Garbage Location
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📷 Upload Garbage Image *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                required
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={400}
                      height={300}
                      className="mx-auto rounded-lg object-cover max-h-64"
                    />
                    <p className="mt-2 text-sm text-gray-500">Click to change image</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-6xl mb-2">📷</div>
                    <p className="text-gray-600 font-medium">Click to upload image</p>
                    <p className="text-sm text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              🏙️ City *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter city name"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📍 Location *
            </label>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleLocationCapture}
                disabled={locationLoading}
                className="w-full p-4 bg-brand text-white rounded-lg cursor-pointer disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
              >
                {locationLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Getting Location...
                  </>
                ) : (
                  <>
                    📍 Get Quick Location
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleHighAccuracyLocation}
                disabled={locationLoading}
                className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
              >
                {locationLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white cursor-pointer"></div>
                    Getting High-Accuracy Location...
                  </>
                ) : (
                  <>
                    🎯 Get High-Accuracy Location (Recommended)
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleShowMapPicker}
                  className="flex-1 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm cursor-pointer"
                >
                  🗺️ Pick on Map
                </button>
                <button
                  type="button"
                  onClick={handleManualLocation}
                  className="flex-1 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm cursor-pointer"
                >
                  ⌨️ Enter Coordinates
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              GPS options for automatic location, or choose manually on map/coordinates for precise control.
            </p>
          </div>

          {showManualEntry && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Enter Coordinates Manually</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={manualCoords.lat}
                      onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
                      className="w-full p-3 border rounded-lg"
                      placeholder="e.g., 28.6139"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={manualCoords.lng}
                      onChange={(e) => setManualCoords(prev => ({ ...prev, lng: e.target.value }))}
                      className="w-full p-3 border rounded-lg"
                      placeholder="e.g., 77.2090"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleManualSubmit}
                      className="flex-1 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Set Location
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManualEntry(false)}
                      className="flex-1 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showMapPicker && (
            <ManualLocationPicker
              onLocationSelect={handleMapLocationSelect}
              onCancel={() => setShowMapPicker(false)}
              initialCenter={currentLocation ? [currentLocation.latitude, currentLocation.longitude] : [28.6139, 77.2090]}
            />
          )}
            
          {currentLocation && (
            <div className={`mt-4 p-4 rounded-lg border ${accuracyInfo?.color || 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {AccuracyIcon && <AccuracyIcon className="w-5 h-5" />}
                <p className="font-medium">
                  📍 Location {manualLocation ? 'Set Manually' : 'Captured'}
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Coordinates:</strong> {currentLocation.latitude.toFixed(8)}, {currentLocation.longitude.toFixed(8)}
                </p>
                
                {accuracyInfo && (
                  <p>
                    <strong>Accuracy:</strong> {accuracyInfo.text}
                  </p>
                )}
                
                <p>
                  <strong>Source:</strong> {manualLocation ? '✋ Manual Entry' : currentLocation.source === 'gps' ? '🛰️ GPS' : currentLocation.source === 'network' ? '📶 Network' : currentLocation.source === 'passive' ? '📡 Passive' : '📍 ' + currentLocation.source}
                </p>
                
                {address && (
                  <p>
                    <strong>Address:</strong> {address}
                  </p>
                )}
              </div>

              {accuracyInfo?.warning && !manualLocation && (
                <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>For better accuracy, try moving to an open area away from buildings.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !formData.image || !currentLocation || !formData.city.trim()}
            className="w-full p-4 bg-blue-600 text-white rounded-lg cursor-pointer disabled:cursor-default hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting Report...
              </>
            ) : (
              <>
                🚀 Submit Report
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default ReportForm;