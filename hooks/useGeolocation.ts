'use client';

import { useState, useCallback } from 'react';
import { LocationData } from '@/types';

interface LocationInfo extends LocationData {
  accuracy: number;
  source: 'gps' | 'network' | 'passive';
  timestamp: number;
}

interface UseGeolocationReturn {
  location: LocationInfo | null;
  error: string | null;
  loading: boolean;
  getCurrentLocation: () => void;
  getHighAccuracyLocation: () => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const processPosition = (position: GeolocationPosition, source: 'gps' | 'network' | 'passive' = 'gps') => {
    const newLocation: LocationInfo = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      source,
      timestamp: position.timestamp,
    };
    
    console.log('Location obtained:', {
      ...newLocation,
      accuracyInMeters: Math.round(position.coords.accuracy),
      readableAccuracy: position.coords.accuracy < 100 ? 'Good' : position.coords.accuracy < 500 ? 'Fair' : 'Poor'
    });
    
    setLocation(newLocation);
    setLoading(false);
  };

  const handleError = (error: GeolocationPositionError) => {
    let errorMessage = 'Failed to get location';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable. Please ensure GPS is enabled.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please try again.';
        break;
    }
    
    setError(errorMessage);
    setLoading(false);
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => processPosition(position, 'network'),
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000, 
      }
    );
  }, []);

  const getHighAccuracyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        processPosition(position, 'network');
        setLoading(true); 
        
        navigator.geolocation.getCurrentPosition(
          (accuratePosition) => {
            if (accuratePosition.coords.accuracy <= position.coords.accuracy) {
              processPosition(accuratePosition, 'gps');
            } else {
              setLoading(false);
            }
          },
          (error) => {
            console.warn('High accuracy location failed:', error);
            setLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 30000, 
            maximumAge: 0, 
          }
        );
      },
      handleError,
      {
        enableHighAccuracy: false, 
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  return { 
    location, 
    error, 
    loading, 
    getCurrentLocation, 
    getHighAccuracyLocation 
  };
};