'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ReportForm from '@/components/ReportForm';
import { IGarbageReport } from '@/types';
import { MapPin, Target, Navigation, AlertTriangle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Animation from '@/components/Animation'
import Trash from '@/public/Dustbin.json'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

type TabType = 'report' | 'map';

interface ExtendedGarbageReport extends IGarbageReport {
  accuracy?: number;
  locationSource?: 'gps' | 'network' | 'manual';
}

interface GarbageReportsApiResponse {
  success: boolean;
  data: {
    reports: ExtendedGarbageReport[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      limit: number;
    };
    statusCounts: {
      pending: number;
      'in-progress': number;
      resolved: number;
      total: number;
    };
  };
  error?: string;
  message?: string;
}

const Page: React.FC = () => {
  const [reports, setReports] = useState<ExtendedGarbageReport[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('report');
  const [loading, setLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0,
    total: 0
  });

  const { showToast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/garbage-reports?limit=50&sortBy=createdAt&sortOrder=desc');

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error:', response.status, errorText);
        throw new Error(`Server error ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      const data: GarbageReportsApiResponse = await response.json();

      if (data.success && data.data && data.data.reports) {
        setReports(data.data.reports);
        setStatusCounts({
          pending: data.data.statusCounts.pending || 0,
          inProgress: data.data.statusCounts['in-progress'] || 0,
          resolved: data.data.statusCounts.resolved || 0,
          total: data.data.statusCounts.total || 0
        });

        if (data.data.reports.length === 0) {
          showToast('No reports found. Be the first to report!', 'info');
        }
      } else {
        console.error('API returned unsuccessful response:', data);
        throw new Error(data.error || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast(`Failed to load reports: ${errorMessage}`, 'error');

      setReports([]);
      setStatusCounts({ pending: 0, inProgress: 0, resolved: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleReportSuccess = async (newReport: IGarbageReport) => {
    try {
      const extendedReport: ExtendedGarbageReport = {
        ...newReport,
        accuracy: newReport.accuracy,
        locationSource: newReport.locationSource || 'network'
      };

      setReports(prev => [extendedReport, ...prev]);
      setStatusCounts(prev => ({
        ...prev,
        pending: prev.pending + 1,
        total: prev.total + 1
      }));

      showToast('Report submitted successfully!', 'success');
      setActiveTab('map');

      await fetchReports();
    } catch (error) {
      console.error('Error handling report success:', error);
      showToast('Report submitted but failed to refresh data', 'warning');

      setReports(prev => prev.filter(r => r._id !== newReport._id));
      setStatusCounts(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        total: Math.max(0, prev.total - 1)
      }));
    }
  };

  const getAccuracyInfo = (accuracy?: number) => {
    if (accuracy === undefined || accuracy === null) {
      return { level: 'unknown', color: 'text-gray-500', text: 'Unknown', icon: MapPin };
    }

    const roundedAccuracy = Math.round(accuracy);

    if (accuracy <= 50) return {
      level: 'excellent',
      color: 'text-green-600',
      text: `Excellent (±${roundedAccuracy}m)`,
      icon: Target
    };
    if (accuracy <= 100) return {
      level: 'good',
      color: 'text-green-500',
      text: `Good (±${roundedAccuracy}m)`,
      icon: Navigation
    };
    if (accuracy <= 200) return {
      level: 'fair',
      color: 'text-yellow-500',
      text: `Fair (±${roundedAccuracy}m)`,
      icon: MapPin
    };
    return {
      level: 'poor',
      color: 'text-red-500',
      text: `Poor (±${roundedAccuracy}m)`,
      icon: AlertTriangle
    };
  };

  const getLocationSourceIcon = (source?: string) => {
    switch (source) {
      case 'gps': return '🛰️';
      case 'network': return '📶';
      case 'manual': return '✋';
      default: return '📍';
    }
  };

  const getAccuracyLevelReports = (level: string) => {
    return reports.filter(r => {
      const info = getAccuracyInfo(r.accuracy);
      return info.level === level;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 pb-4 mb-4 text-center">
          <div className="flex justify-center">
            <Animation animationData={Trash} width={200} height={200} />
          </div>

          <h1 className="text-4xl font-bold text-gray-800 -mt-6 mb-2">
            Smart Garbage
          </h1>

          <p className="text-gray-600 max-w-2xl mx-auto">
            Help keep our cities clean by reporting garbage locations with photos and GPS coordinates
          </p>
        </div>



      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Pending</p>
                <p className="text-2xl font-bold text-red-700">{statusCounts.pending}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-700">{statusCounts.inProgress}</p>
              </div>
              <div className="text-3xl">🔄</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Resolved</p>
                <p className="text-2xl font-bold text-green-700">{statusCounts.resolved}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Location Accuracy Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            {(['excellent', 'good', 'fair', 'poor'] as const).map((level) => {
              const levelReports = getAccuracyLevelReports(level);
              const count = levelReports.length;
              const percentage = reports.length > 0 ? Math.round((count / reports.length) * 100) : 0;

              return (
                <div key={level} className="p-3 bg-gray-50 rounded-lg">
                  <div className={`text-2xl font-bold ${getAccuracyInfo(level === 'excellent' ? 25 : level === 'good' ? 75 : level === 'fair' ? 150 : 300).color}`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">{level}</div>
                  <div className="text-xs text-gray-500">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-md border">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-8 py-3 rounded-lg transition-all duration-200 font-medium ${activeTab === 'report'
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
            >
              📝 Report Garbage
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-8 py-3 rounded-lg transition-all duration-200 font-medium ${activeTab === 'map'
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
            >
              🗺️ View Map ({reports.length})
            </button>
          </div>
        </div>

        {activeTab === 'report' && (
          <div className="animate-fadeIn">
            <ReportForm onSuccess={handleReportSuccess} />
          </div>
        )}

        {activeTab === 'map' && (
          <div className="animate-fadeIn">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">
                  🗺️ Garbage Reports Map
                </h2>
                <button
                  onClick={fetchReports}
                  disabled={loading}
                  className="px-4 py-2 bg-brand cursor-pointer disabled:cursor-default text-white rounded-lg  disabled:bg-gray-400 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      🔄 Refresh
                    </>
                  )}
                </button>
              </div>

              <MapView reports={reports} height="600px" />

              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  📋 Recent Reports
                </h3>

                {reports.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
                    {reports.slice(0, 12).map((report) => {
                      const accuracyInfo = getAccuracyInfo(report.accuracy);
                      const AccuracyIcon = accuracyInfo.icon;

                      return (
                        <div
                          key={report._id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="relative mb-3">
                            <img
                              src={report.image}
                              alt="Garbage report"
                              className="w-full h-32 object-cover rounded-lg"
                              loading="lazy"
                            />
                            <div className="absolute top-2 right-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${report.status === 'resolved'
                                  ? 'bg-green-100 text-green-800'
                                  : report.status === 'in-progress'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                  }`}
                              >
                                {report.status}
                              </span>
                            </div>
                            <div className="absolute top-2 left-2">
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/90 ${accuracyInfo.color}`}>
                                <AccuracyIcon className="w-3 h-3" />
                                {report.accuracy ? Math.round(report.accuracy) + 'm' : '?'}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="font-semibold text-gray-800 flex items-center gap-1">
                              📍 {report.city}
                            </p>

                            {report.address && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {report.address}
                              </p>
                            )}

                            <div className="flex items-center gap-2 text-xs">
                              <div className={`flex items-center gap-1 ${accuracyInfo.color}`}>
                                <AccuracyIcon className="w-3 h-3" />
                                <span>{accuracyInfo.text}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-500">
                                <span>{getLocationSourceIcon(report.locationSource)}</span>
                                <span className="capitalize">{report.locationSource || 'Unknown'}</span>
                              </div>
                            </div>

                            <p className="text-xs text-gray-500">
                              🕒 {new Date(report.createdAt).toLocaleString()}
                            </p>

                            <p className="text-xs text-gray-400">
                              📐 {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
                            </p>

                            {report.accuracy && report.accuracy > 200 && (
                              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Low accuracy location</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-6xl mb-4">📍</div>
                    <p className="text-gray-500 text-lg">No reports available yet</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Be the first to report a garbage location!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">🌍 Help keep our environment clean</p>
            <p className="text-sm">
              Report garbage locations to help maintain cleaner cities
            </p>
            <div className="mt-4 text-xs text-gray-500">
              <p>Location accuracy: 🛰️ GPS • 📶 Network • ✋ Manual • 📍 Unknown</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Page;