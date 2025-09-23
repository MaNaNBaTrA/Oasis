'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { IGarbageReport } from '@/types';

interface MapViewProps {
  reports: IGarbageReport[];
  center?: [number, number];
  height?: string;
  className?: string;
}

const MapView: React.FC<MapViewProps> = ({ 
  reports, 
  center = [28.6139, 77.2090], 
  height = '500px',
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletCSSLoaded = useRef<boolean>(false);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [markerCount, setMarkerCount] = useState(0);
  const leafletRef = useRef<any>(null);
  const isDestroyedRef = useRef(false);

  useEffect(() => {
    console.log('🗺️ MapView: Reports received:', reports);
    console.log('🗺️ MapView: Number of reports:', reports.length);
    if (reports.length > 0) {
      console.log('🗺️ MapView: First report:', reports[0]);
      reports.forEach((report, index) => {
        console.log(`🗺️ Report ${index + 1}:`, {
          id: report._id,
          city: report.city,
          coordinates: [report.location.latitude, report.location.longitude],
          status: report.status,
          image: report.image
        });
      });
    }
  }, [reports]);

  useEffect(() => {
    if (!leafletCSSLoaded.current && typeof document !== 'undefined') {
      const existingLink = document.querySelector('link[href*="leaflet.css"]');
      if (!existingLink) {
        console.log('🗺️ Loading Leaflet CSS...');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
        console.log('✅ Leaflet CSS loaded');
      } else {
        console.log('✅ Leaflet CSS already exists');
      }
      leafletCSSLoaded.current = true;
    }
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'resolved':
        return '#10b981'; 
      case 'in-progress':
        return '#f59e0b'; 
      case 'pending':
      default:
        return '#ef4444'; 
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'resolved':
        return 'Resolved';
      case 'in-progress':
        return 'In Progress';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  const createPopupContent = (report: IGarbageReport): string => {
    const statusColor = getStatusColor(report.status);
    const statusLabel = getStatusLabel(report.status);
    
    return `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 280px;">
        <img 
          src="${report.image}" 
          alt="Garbage report" 
          style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;" 
          loading="lazy"
          onerror="this.style.display='none'"
        />
        
        <div style="margin-bottom: 10px;">
          <span style="
            background-color: ${statusColor}; 
            color: white; 
            padding: 4px 10px; 
            border-radius: 16px; 
            font-size: 11px; 
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">
            ${statusLabel}
          </span>
        </div>
        
        <div style="space-y: 6px;">
          <p style="margin: 8px 0; font-weight: 600; color: #1f2937; font-size: 15px;">
            📍 ${escapeHtml(report.city)}
          </p>
          
          ${report.address ? `
            <p style="margin: 6px 0; font-size: 13px; color: #4b5563; line-height: 1.4;">
              ${escapeHtml(report.address)}
            </p>
          ` : ''}
          
          <p style="margin: 6px 0; font-size: 12px; color: #6b7280;">
            🕒 ${formatDate(report.createdAt)}
          </p>
          
          <p style="margin: 6px 0; font-size: 11px; color: #9ca3af; font-family: monospace;">
            ${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}
          </p>
        </div>
      </div>
    `;
  };

  const escapeHtml = (text: string): string => {
    if (typeof document === 'undefined') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const formatDate = (date: Date | string): string => {
    try {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const clearAllMarkers = useCallback(() => {
    if (isDestroyedRef.current) {
      console.log('🧹 Skipping marker clearing - component destroyed');
      return;
    }

    console.log('🧹 Clearing', markersRef.current.length, 'existing markers');
    markersRef.current.forEach((marker, index) => {
      try {
        if (marker && typeof marker.remove === 'function') {
          marker.remove();
          console.log(`✅ Removed marker ${index + 1} using remove()`);
        } else if (mapInstanceRef.current && marker && typeof mapInstanceRef.current.removeLayer === 'function') {
          mapInstanceRef.current.removeLayer(marker);
          console.log(`✅ Removed marker ${index + 1} using removeLayer()`);
        }
      } catch (error) {
        console.warn(`⚠️ Error removing marker ${index + 1}:`, error);
      }
    });
    markersRef.current = [];
    setMarkerCount(0);
  }, []);

  const updateMarkersForReports = useCallback(async (reportsToProcess: IGarbageReport[]) => {
    if (!mapInstanceRef.current || isDestroyedRef.current) {
      console.log('🗺️ updateMarkersForReports skipped - map not ready or destroyed');
      return;
    }

    try {
      let L = leafletRef.current;
      if (!L) {
        L = await import('leaflet');
        leafletRef.current = L;
      }
      console.log('✅ Leaflet loaded for marker update');
      
      clearAllMarkers();

      if (reportsToProcess.length === 0) {
        console.log('ℹ️ No reports to add markers for');
        return;
      }

      const createGarbageIcon = (status: string) => {
        const color = getStatusColor(status);
        console.log(`🎨 Creating icon for status "${status}" with color ${color}`);
        
        return L.divIcon({
          className: 'custom-garbage-marker',
          html: `
            <div style="
              background-color: ${color}; 
              width: 32px; 
              height: 32px; 
              border-radius: 50%; 
              border: 3px solid white; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              box-shadow: 0 3px 10px rgba(0,0,0,0.3);
              cursor: pointer;
              font-size: 16px;
              position: relative;
            ">
              🗑️
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -20],
        });
      };

      const newMarkers: any[] = [];
      let validReports = 0;

      for (let i = 0; i < reportsToProcess.length; i++) {
        if (isDestroyedRef.current || !mapInstanceRef.current) {
          console.log('🗺️ Breaking marker creation loop - map destroyed');
          break;
        }

        const report = reportsToProcess[i];
        console.log(`📍 Processing report ${i + 1}:`, {
          id: report._id,
          city: report.city,
          lat: report.location.latitude,
          lng: report.location.longitude,
          status: report.status
        });

        try {
          let lat = report.location.latitude;
          let lng = report.location.longitude;

          if (typeof lat === 'string') lat = parseFloat(lat);
          if (typeof lng === 'string') lng = parseFloat(lng);
          
          console.log(`🔍 Coordinates after parsing - lat: ${lat} (${typeof lat}), lng: ${lng} (${typeof lng})`);
          
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.error(`❌ Invalid coordinates for report ${report._id}:`, { lat, lng });
            continue;
          }

          validReports++;
          console.log(`✅ Creating marker ${i + 1} at coordinates:`, [lat, lng]);

          const marker = L.marker([lat, lng], { 
            icon: createGarbageIcon(report.status)
          });

          const popupContent = createPopupContent(report);
          marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup',
            closeButton: true,
            autoClose: true,
          });

          marker.on('click', (e: any) => {
            console.log('🖱️ Marker clicked:', report._id, e);
          });

          if (mapInstanceRef.current && !isDestroyedRef.current) {
            marker.addTo(mapInstanceRef.current);
            newMarkers.push(marker);
            console.log(`✅ Marker ${i + 1} added to map successfully`);
          }

        } catch (error) {
          console.error(`❌ Error creating marker ${i + 1} for report ${report._id}:`, error);
        }
      }

      if (!isDestroyedRef.current) {
        markersRef.current = newMarkers;
        setMarkerCount(newMarkers.length);
        console.log(`✅ Final marker count: ${newMarkers.length} markers added to map (${validReports} valid reports)`);

        if (newMarkers.length > 0 && mapInstanceRef.current) {
          try {
            console.log('🗺️ Fitting map bounds to show all markers...');
            const group = L.featureGroup(newMarkers);
            
            if (group && typeof group.getBounds === 'function') {
              const bounds = group.getBounds();
              console.log('📐 Calculated bounds:', bounds);
              
              if (bounds.isValid()) {
                mapInstanceRef.current.fitBounds(bounds, {
                  padding: [30, 30],
                  maxZoom: 15,
                });
                console.log('✅ Map bounds fitted');
              } else {
                console.warn('⚠️ Invalid bounds calculated');
              }
            }
          } catch (error) {
            console.error('❌ Error fitting bounds:', error);
            if (newMarkers.length > 0 && mapInstanceRef.current && !isDestroyedRef.current) {
              const firstMarker = newMarkers[0];
              if (firstMarker && typeof firstMarker.getLatLng === 'function') {
                mapInstanceRef.current.setView(firstMarker.getLatLng(), 13);
                console.log('✅ Fallback: centered on first marker');
              }
            }
          }
        }

        setTimeout(() => {
          if (mapInstanceRef.current && !isDestroyedRef.current) {
            mapInstanceRef.current.invalidateSize();
            console.log('🔄 Map size invalidated');
          }
        }, 100);
      }

    } catch (error) {
      console.error('❌ Error updating markers:', error);
    }
  }, [clearAllMarkers]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) {
      console.log('🗺️ Map initialization skipped - no window or mapRef');
      return;
    }
    
    if (mapInstanceRef.current) {
      console.log('🗺️ Map already initialized');
      return;
    }

    const initializeMap = async () => {
      try {
        isDestroyedRef.current = false;
        console.log('🗺️ Starting map initialization...');
        const L = await import('leaflet');
        leafletRef.current = L; 
        console.log('✅ Leaflet library loaded');

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        
        if (mapRef.current && !mapInstanceRef.current && !isDestroyedRef.current) {
          const mapInstance = L.map(mapRef.current, {
            center: center,
            zoom: 12,
            zoomControl: true,
            attributionControl: true,
          });

          console.log('✅ Map instance created with center:', center);

          const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
            maxZoom: 18,
            minZoom: 1,
          });

          tileLayer.addTo(mapInstance);
          console.log('✅ Tile layer added');

          mapInstanceRef.current = mapInstance;
          
          mapInstance.whenReady(() => {
            if (!isDestroyedRef.current) {
              console.log('✅ Map whenReady triggered - setting mapReady to true');
              setMapReady(true);
            }
          });

          setTimeout(() => {
            if (!isDestroyedRef.current) {
              console.log('✅ Map ready timeout fallback triggered');
              setMapReady(true);
            }
          }, 1000);

          console.log('✅ Map initialization complete');
        }
      } catch (error) {
        console.error('❌ Error initializing map:', error);
        if (!isDestroyedRef.current) {
          setTimeout(() => {
            console.log('🚨 Error fallback - setting mapReady to true');
            setMapReady(true);
          }, 1000);
        }
      }
    };

    initializeMap();

    return () => {
      console.log('🧹 Cleaning up map...');
      isDestroyedRef.current = true;
      
      clearAllMarkers();
      
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          console.log('✅ Map instance removed');
        } catch (error) {
          console.warn('⚠️ Error removing map:', error);
        }
        mapInstanceRef.current = null;
      }
      
      setMapReady(false);
      setMarkerCount(0);
    };
  }, []); 

  useEffect(() => {
    console.log('🎯 Marker update effect triggered:', {
      mapReady,
      mapInstance: !!mapInstanceRef.current,
      reportsLength: reports.length,
      leafletCached: !!leafletRef.current,
      destroyed: isDestroyedRef.current
    });

    if (mapReady && mapInstanceRef.current && reports.length > 0 && !isDestroyedRef.current) {
      console.log('🎯 All conditions met - updating markers:', reports.length);
      
      const timeoutId = setTimeout(() => {
        if (!isDestroyedRef.current) {
          updateMarkersForReports(reports);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      console.log('🗺️ Marker update skipped - not all conditions met');
    }
  }, [reports, mapReady, updateMarkersForReports]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="rounded-lg border border-gray-200 shadow-sm bg-gray-100"
      />
      
      <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded text-xs font-mono z-[1000]">
        Reports: {reports.length} | Markers: {markerCount} | Ready: {mapReady ? '✅' : '❌'}
      </div>
      
      {reports.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 rounded-lg backdrop-blur-sm">
          <div className="text-center p-6">
            <div className="text-4xl mb-3">📍</div>
            <p className="text-gray-600 font-medium mb-1">No reports to display</p>
            <p className="text-gray-500 text-sm">Submit a report to see it on the map</p>
          </div>
        </div>
      )}
      
      {(typeof window !== 'undefined' && (!mapInstanceRef.current || !mapReady)) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;