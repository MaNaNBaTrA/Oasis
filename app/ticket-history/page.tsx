'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle, AlertCircle, Play, Loader2, RefreshCw } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';

interface GarbageReport {
  _id: string;
  image: string;
  location: {
    latitude: number;
    longitude: number;
  };
  city: string;
  address?: string;
  reportedBy?: string;
  status: 'pending' | 'in-progress' | 'resolved';
  accuracy?: number;
  locationSource?: 'gps' | 'network' | 'manual';
  createdAt: string;
  updatedAt: string;
}

interface StatusCounts {
  pending: number;
  'in-progress': number;
  resolved: number;
  total: number;
}

interface ApiResponse {
  success: boolean;
  data?: {
    reports: GarbageReport[];
    statusCounts: StatusCounts;
  };
  error?: string;
  message?: string;
  details?: string;
}

type ReportStatus = 'pending' | 'in-progress' | 'resolved';

const UserReportsPage: React.FC = () => {
  const [reports, setReports] = useState<GarbageReport[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    'in-progress': 0,
    resolved: 0,
    total: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (): Promise<void> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError('Authentication error. Please try logging in again.');
        setLoading(false);
        return;
      }

      if (!session?.user) {
        setError('Please login to view your reports');
        setLoading(false);
        return;
      }

      setUser(session.user);
      await fetchUserReports(session.user.id);
    } catch (err) {
      console.error('Auth check error:', err);
      setError('Failed to authenticate user');
      setLoading(false);
    }
  };

  const fetchUserReports = async (userId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `/api/garbage-reports/user/${encodeURIComponent(userId)}?sortBy=createdAt&sortOrder=desc&limit=100`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch reports: ${response.status} ${errorText}`);
      }
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || result.details || 'Failed to fetch reports');
      }
      
      if (result.data) {
        setReports(result.data.reports);
        setStatusCounts(result.data.statusCounts);
      } else {
        setReports([]);
        setStatusCounts({ pending: 0, 'in-progress': 0, resolved: 0, total: 0 });
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reports';
      setError(errorMessage);
      setReports([]);
      setStatusCounts({ pending: 0, 'in-progress': 0, resolved: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    if (!user?.id) return;
    
    setRefreshing(true);
    await fetchUserReports(user.id);
    setRefreshing(false);
  };

  const getStatusColor = (status: ReportStatus): string => {
    const colors = {
      'pending': 'text-yellow-700 bg-yellow-100 border-yellow-200',
      'in-progress': 'text-blue-700 bg-blue-100 border-blue-200',
      'resolved': 'text-green-700 bg-green-100 border-green-200'
    };
    return colors[status] || 'text-gray-700 bg-gray-100 border-gray-200';
  };

  const getStatusIcon = (status: ReportStatus): React.ReactElement => {
    const icons = {
      'pending': <Clock className="w-4 h-4" />,
      'in-progress': <Play className="w-4 h-4" />,
      'resolved': <CheckCircle className="w-4 h-4" />
    };
    return icons[status] || <AlertCircle className="w-4 h-4" />;
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const target = e.target as HTMLImageElement;
    target.src = '/placeholder-image.jpg';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Reports</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          {user && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Try Again
            </button>
          )}
          <div className="mt-4 text-sm text-gray-500">
            <p>Debug info:</p>
            <p>User ID: {user?.id || 'Not available'}</p>
            <p>Endpoint: /api/garbage-reports/user/{user?.id || 'undefined'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reports</h1>
              <p className="text-gray-600">Track the status of your garbage reports</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white border cursor-pointer disabled:cursor-default border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>
          </div>
        </div>

        {statusCounts.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
              <div className="text-sm text-gray-600">Total Reports</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{statusCounts['in-progress']}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{statusCounts.resolved}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
          </div>
        )}

        {reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Yet</h3>
              <p className="text-gray-600 mb-6">You haven't submitted any garbage reports yet. Start making a difference in your community!</p>
              <a
                href="/raise-ticket"
                className="bg-brand text-white px-6 py-3 rounded-lg hover:bg-brand/90 transition-colors inline-block"
              >
                Create Your First Report
              </a>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <div key={report._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                  <img
                    src={report.image}
                    alt="Garbage report"
                    className="w-full h-48 object-cover"
                    onError={handleImageError}
                  />
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1).replace('-', ' ')}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      #{report._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-700 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{report.city}</div>
                        {report.address && (
                          <div className="text-gray-500 text-xs mt-1 line-clamp-2">{report.address}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
                        </div>
                        {report.accuracy && (
                          <div className="text-xs text-gray-400">
                            Accuracy: ±{Math.round(report.accuracy)}m
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 border-t border-gray-100 pt-3 space-y-1">
                      <div className="flex justify-between">
                        <span>Reported:</span>
                        <span>{formatDate(report.createdAt)}</span>
                      </div>
                      {report.updatedAt !== report.createdAt && (
                        <div className="flex justify-between">
                          <span>Updated:</span>
                          <span>{formatDate(report.updatedAt)}</span>
                        </div>
                      )}
                      {report.locationSource && (
                        <div className="flex justify-between">
                          <span>Location:</span>
                          <span className="capitalize">{report.locationSource}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserReportsPage;