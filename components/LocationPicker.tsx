'use client';

import { useEffect, useRef, useState } from 'react';
import { reverseGeocode } from '@/lib/geocoding';
import { useToast } from '@/context/ToastContext';

interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy: number;
  source: 'gps' | 'network' | 'passive';
  timestamp: number;
}

interface ManualLocationPickerProps {
  onLocationSelect: (location: LocationInfo) => void;
  onCancel: () => void;
  initialCenter?: [number, number];
  height?: string;
}

const ManualLocationPicker: React.FC<ManualLocationPickerProps> = ({
  onLocationSelect,
  onCancel,
  initialCenter = [28.6139, 77.2090],
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletCSSLoaded = useRef<boolean>(false);
  const isInitializing = useRef<boolean>(false);
  
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  const { showToast } = useToast();

  useEffect(() => {
    if (!leafletCSSLoaded.current && typeof document !== 'undefined') {
      const existingLink = document.querySelector('link[href*="leaflet.css"]');
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }
      leafletCSSLoaded.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstanceRef.current || isInitializing.current) {
      return;
    }

    const initializeMap = async () => {
      try {
        isInitializing.current = true;
        setMapError(null);
        
        const L = await import('leaflet');

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        const mapInstance = L.map(mapRef.current!, {
          center: initialCenter,
          zoom: 15,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(mapInstance);

        const createLocationIcon = (color: string = '#3b82f6') => {
          return L.divIcon({
            className: 'custom-location-marker',
            html: `
              <div style="
                background-color: ${color}; 
                width: 24px; 
                height: 24px; 
                border-radius: 50%; 
                border: 3px solid white; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: white;
                font-weight: bold;
              ">
                📍
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
        };

        mapInstance.on('click', async (e: any) => {
          try {
            const { lat, lng } = e.latlng;
            setSelectedLocation({ lat, lng });
            setLoadingAddress(true);

            if (markerRef.current) {
              mapInstance.removeLayer(markerRef.current);
            }

            const marker = L.marker([lat, lng], { icon: createLocationIcon() });
            marker.addTo(mapInstance);
            markerRef.current = marker;

            const resolvedAddress = await reverseGeocode(lat, lng);
            setAddress(resolvedAddress);
          } catch (error) {
            console.error('Error handling map click:', error);
            setAddress('Address not available');
          } finally {
            setLoadingAddress(false);
          }
        });

        mapInstanceRef.current = mapInstance;
        setMapReady(true);

      } catch (error) {
        console.error('Error initializing location picker map:', error);
        setMapError('Failed to load map. Please try again.');
      } finally {
        isInitializing.current = false;
      }
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
      setMapReady(false);
      isInitializing.current = false;
    };
  }, [initialCenter]);

  const handleConfirmLocation = () => {
    if (!selectedLocation) {
      showToast('Please select a location on the map first', 'warning');
      return;
    }

    const location: LocationInfo = {
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      accuracy: 5,
      source: 'passive',
      timestamp: Date.now()
    };

    onLocationSelect(location);
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation || !mapInstanceRef.current) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const L = await import('leaflet');
          
          mapInstanceRef.current.setView([latitude, longitude], 16);
          
          setSelectedLocation({ lat: latitude, lng: longitude });
          setLoadingAddress(true);

          if (markerRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
          }

          const locationIcon = L.divIcon({
            className: 'custom-location-marker',
            html: `
              <div style="
                background-color: #10b981; 
                width: 24px; 
                height: 24px; 
                border-radius: 50%; 
                border: 3px solid white; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: white;
                font-weight: bold;
              ">
                📍
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const marker = L.marker([latitude, longitude], { icon: locationIcon });
          marker.addTo(mapInstanceRef.current);
          markerRef.current = marker;

          const resolvedAddress = await reverseGeocode(latitude, longitude);
          setAddress(resolvedAddress);
          showToast('Current location found successfully', 'success');
        } catch (error) {
          console.error('Error processing current location:', error);
          setAddress('Address not available');
          showToast('Location found but could not resolve address', 'warning');
        } finally {
          setLoadingAddress(false);
        }
      },
      (error) => {
        console.error('Error getting current location:', error);
        let message = 'Could not get your current location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
        }
        
        showToast(message, 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  useEffect(() => {
    if (mapReady) {
      showToast('Map loaded successfully. Click anywhere to select a location.', 'success');
    }
  }, [mapReady, showToast]);

  useEffect(() => {
    if (mapError) {
      showToast('Failed to load map. Please try again.', 'error');
    }
  }, [mapError, showToast]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Choose Location on Map
          </h3>
          <p className="text-sm text-gray-600">
            Click on the map to select your exact location, or use your current GPS location
          </p>
        </div>

        <div className="relative">
          {mapError ? (
            <div className="flex items-center justify-center bg-red-50 p-8" style={{ height }}>
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <p className="text-red-600 font-medium">{mapError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                ref={mapRef}
                style={{ height, width: '100%' }}
                className="bg-gray-100"
              />
              
              {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}

              <button
                onClick={getCurrentLocation}
                disabled={!mapReady}
                className="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors z-[1000]"
                title="Use my current location"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </>
          )}
        </div>

        {selectedLocation && (
          <div className="p-4 bg-blue-50 border-t border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-1">Selected Location:</p>
                <p className="text-sm text-gray-600 font-mono">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
                {loadingAddress ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-500"></div>
                    <p className="text-sm text-gray-500">Loading address...</p>
                  </div>
                ) : address && (
                  <p className="text-sm text-gray-700 mt-1">{address}</p>
                )}
              </div>
              <div className="text-2xl">📍</div>
            </div>
          </div>
        )}

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmLocation}
            disabled={!selectedLocation || !mapReady}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Use This Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualLocationPicker;