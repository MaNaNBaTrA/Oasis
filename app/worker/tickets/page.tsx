'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, CheckCircle, AlertCircle, Play, Loader2, RefreshCw, Camera, Shield, X, Check } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

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

interface PPEDetection {
  gloves: number;
  mask: number;
  vest: number;
  helmet: number;
}

interface SafetyCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reportId: string;
  newStatus: 'in-progress' | 'resolved';
}

type ReportStatus = 'pending' | 'in-progress' | 'resolved';

const SafetyCheckModal: React.FC<SafetyCheckModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  reportId, 
  newStatus 
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<'capture' | 'checking' | 'result'>('capture');
  const [imageData, setImageData] = useState<string>('');
  const [ppeDetection, setPpeDetection] = useState<PPEDetection | null>(null);
  const [error, setError] = useState<string>('');
  const [isSafetyPassed, setIsSafetyPassed] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [missingItems, setMissingItems] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && step === 'capture') {
      setError('');
    }
  }, [isOpen, step]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        setImageData(imageDataUrl);
        setStep('checking');
        performSafetyCheck(imageDataUrl);
      };
      reader.onerror = () => {
        showToast('Failed to read image file', 'error');
      };
      reader.readAsDataURL(file);
    }
  };

  const performSafetyCheck = async (imageDataUrl: string) => {
    try {
      setError('');
      
      const base64Data = imageDataUrl.split(',')[1];
      
      console.log('🔄 Starting PPE safety check...');
      console.log('📤 Sending request to /api/predict');
      
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
        }),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error('Failed to analyze safety equipment');
      }

      const result = await response.json();
      
      console.log('🎯 Full API Response:');
      console.log(JSON.stringify(result, null, 2));
      
      console.log('📊 Response structure analysis:');
      console.log('- Type of result:', typeof result);
      console.log('- Keys in result:', Object.keys(result));
      
      if (result.predictions) {
        console.log('📋 Predictions found:', result.predictions.length);
        console.log('📋 Predictions:', result.predictions);
        
        result.predictions.forEach((prediction: any, index: number) => {
          console.log(`🔍 Prediction ${index + 1}:`, {
            class: prediction.class,
            confidence: prediction.confidence,
            x: prediction.x,
            y: prediction.y,
            width: prediction.width,
            height: prediction.height
          });
        });
      } else {
        console.log('⚠️ No predictions array found in response');
        console.log('🔍 Available keys:', Object.keys(result));
      }
      
      const detections = parsePPEDetections(result);
      console.log('🛡️ Parsed PPE detections:', detections);
      
      setPpeDetection(detections);
      
      const { safetyPassed, missing } = checkSafetyCompliance(detections);
      console.log('✅ Safety compliance check:', { safetyPassed, missing });
      
      setIsSafetyPassed(safetyPassed);
      setMissingItems(missing);
      
      if (safetyPassed) {
        showToast('All safety equipment detected!', 'success');
      } else {
        showToast(`Missing: ${missing.join(', ')}`, 'warning');
      }
      
      setStep('result');
    } catch (err) {
      console.error('💥 Error in performSafetyCheck:', err);
      const errorMsg = err instanceof Error ? err.message : 'Safety check failed';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setStep('result');
    }
  };

  const parsePPEDetections = (roboflowResult: any): PPEDetection => {
    console.log('🔄 Starting to parse PPE detections...');
    console.log('📥 Input to parsePPEDetections:', roboflowResult);
    
    const detection: PPEDetection = {
      gloves: 0,
      mask: 0,
      vest: 0,
      helmet: 0
    };

    try {
      let predictions: any[] = [];
      
      if (roboflowResult?.outputs && roboflowResult.outputs.length > 0) {
        const firstOutput = roboflowResult.outputs[0];
        if (firstOutput?.predictions?.predictions) {
          predictions = firstOutput.predictions.predictions;
          console.log('📍 Using workflow API structure: outputs[0].predictions.predictions');
        }
      } else if (roboflowResult?.predictions) {
        predictions = roboflowResult.predictions;
        console.log('📍 Using direct predictions structure');
      }
      
      if (predictions.length > 0) {
        console.log(`🔍 Processing ${predictions.length} predictions...`);
        
        predictions.forEach((prediction: any, index: number) => {
          const className = prediction.class?.toLowerCase() || '';
          const confidence = prediction.confidence || 0;
          console.log(`🏷️ Prediction ${index + 1} - Class: "${className}" (original: "${prediction.class}"), Confidence: ${(confidence * 100).toFixed(1)}%`);
          
          if (className === 'glove' || className === 'gloves') {
            detection.gloves++;
            console.log(`🧤 Found glove! Total gloves: ${detection.gloves}`);
          } else if (className === 'mask' || className.includes('mask')) {
            detection.mask++;
            console.log(`😷 Found mask! Total masks: ${detection.mask}`);
          } else if (className === 'face') {
            console.log(`👤 Found unprotected face! This indicates NO mask is worn`);
          } else if (className === 'vest' || className === 'jacket' || className.includes('vest')) {
            detection.vest++;
            console.log(`🦺 Found vest! Total vests: ${detection.vest}`);
          } else if (className === 'helmet' || className === 'hardhat' || className === 'hard-hat' || className.includes('helmet') || className.includes('hat')) {
            detection.helmet++;
            console.log(`⛑️ Found helmet! Total helmets: ${detection.helmet}`);
          } else {
            console.log(`❓ Unknown class: "${className}"`);
          }
        });
      } else {
        console.log('⚠️ No predictions found in any expected location');
        console.log('🔍 Response structure:', Object.keys(roboflowResult));
        
        if (roboflowResult.outputs) {
          console.log('📁 Outputs structure:', roboflowResult.outputs.map((o: any, i: number) => 
            `Output ${i}: ${Object.keys(o)}`
          ));
        }
      }
    } catch (err) {
      console.error('💥 Error parsing PPE detections:', err);
    }

    console.log('🛡️ Final detection counts:', detection);
    return detection;
  };

  const checkSafetyCompliance = (detection: PPEDetection): { safetyPassed: boolean; missing: string[] } => {
    console.log('🔍 Checking safety compliance for:', detection);
    
    const missing: string[] = [];
    
    if (detection.gloves < 2) {
      missing.push(`Gloves (${detection.gloves}/2)`);
      console.log(`❌ Gloves missing: need 2, found ${detection.gloves}`);
    } else {
      console.log('✅ Gloves requirement met');
    }
    
    if (detection.mask < 1) {
      missing.push('Face mask');
      console.log('❌ Face mask missing');
    } else {
      console.log('✅ Face mask requirement met');
    }
    
    if (detection.vest < 1) {
      missing.push('Safety vest');
      console.log('❌ Safety vest missing');
    } else {
      console.log('✅ Safety vest requirement met');
    }
    
    if (detection.helmet < 1) {
      missing.push('Helmet');
      console.log('❌ Helmet missing');
    } else {
      console.log('✅ Helmet requirement met');
    }
    
    const result = {
      safetyPassed: missing.length === 0,
      missing
    };
    
    console.log('🏁 Safety compliance result:', result);
    return result;
  };

  const updateReportStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/garbage-reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report status');
      }

      showToast(`Report status updated to ${newStatus.replace('-', ' ')}`, 'success');
      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update status';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const resetModal = () => {
    setStep('capture');
    setImageData('');
    setPpeDetection(null);
    setError('');
    setIsSafetyPassed(false);
    setIsUpdatingStatus(false);
    setMissingItems([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Safety Equipment Check
            </h2>
            <button
              onClick={() => {
                resetModal();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'capture' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Before updating the report status, we need to verify you're wearing all required safety equipment:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Safety gloves (both hands)</li>
                <li>• Face mask</li>
                <li>• Safety vest</li>
                <li>• Hard hat/helmet</li>
              </ul>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload Your Safety Equipment Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer border border-gray-300 rounded-lg p-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'checking' && (
            <div className="text-center py-8">
              <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Analyzing safety equipment...</p>
            </div>
          )}

          {step === 'result' && (
            <div className="space-y-6">
              {imageData && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Safety Check Image</h3>
                  <div className="bg-white p-2 rounded-lg border">
                    <img
                      src={imageData}
                      alt="Safety check"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  </div>
                </div>
              )}

              {ppeDetection && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Detection Results</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg border ${ppeDetection.gloves >= 2 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Gloves</span>
                        {ppeDetection.gloves >= 2 ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {ppeDetection.gloves}/2 detected
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${ppeDetection.mask >= 1 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Mask</span>
                        {ppeDetection.mask >= 1 ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {ppeDetection.mask}/1 detected
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${ppeDetection.vest >= 1 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Safety Vest</span>
                        {ppeDetection.vest >= 1 ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {ppeDetection.vest}/1 detected
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${ppeDetection.helmet >= 1 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Helmet</span>
                        {ppeDetection.helmet >= 1 ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {ppeDetection.helmet}/1 detected
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className={`p-4 rounded-lg border ${isSafetyPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isSafetyPassed ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Safety Check Passed</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-900">Safety Check Failed</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {isSafetyPassed 
                    ? "All required safety equipment detected. You can proceed to update the report status."
                    : `Missing equipment: ${missingItems.join(', ')}. Please ensure you're wearing all PPE before proceeding.`
                  }
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    resetModal();
                    setStep('capture');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Upload Different Photo
                </button>
                
                {isSafetyPassed && (
                  <button
                    onClick={updateReportStatus}
                    disabled={isUpdatingStatus}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Update Status
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const WorkerDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState<GarbageReport[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    'in-progress': 0,
    resolved: 0,
    total: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<ReportStatus | 'all'>('all');
  
  const [safetyModalOpen, setSafetyModalOpen] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [pendingStatus, setPendingStatus] = useState<'in-progress' | 'resolved'>('in-progress');

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/garbage-reports?sortBy=createdAt&sortOrder=desc&limit=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch reports: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch reports');
      }
      
      if (result.data) {
        setReports(result.data.reports);
        setStatusCounts(result.data.statusCounts);
        showToast('Reports loaded successfully', 'success');
      } else {
        setReports([]);
        setStatusCounts({ pending: 0, 'in-progress': 0, resolved: 0, total: 0 });
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reports';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setReports([]);
      setStatusCounts({ pending: 0, 'in-progress': 0, resolved: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchAllReports();
    setRefreshing(false);
  };

  const handleStatusUpdate = (reportId: string, newStatus: 'in-progress' | 'resolved') => {
    setSelectedReport(reportId);
    setPendingStatus(newStatus);
    setSafetyModalOpen(true);
  };

  const handleSafetyCheckSuccess = () => {
    fetchAllReports();
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

  const filteredReports = reports.filter(report => 
    selectedStatusFilter === 'all' || report.status === selectedStatusFilter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading reports...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Worker Dashboard</h1>
              <p className="text-gray-600">Manage and update garbage collection reports</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'in-progress', 'resolved'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedStatusFilter(filter as ReportStatus | 'all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatusFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-600">
                {selectedStatusFilter === 'all' 
                  ? "No garbage reports have been submitted yet."
                  : `No reports with status "${selectedStatusFilter.replace('-', ' ')}" found.`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
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
                    </div>

                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      {report.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(report._id, 'in-progress')}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Start Work
                        </button>
                      )}
                      
                      {report.status === 'in-progress' && (
                        <button
                          onClick={() => handleStatusUpdate(report._id, 'resolved')}
                          className="w-full bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Complete
                        </button>
                      )}
                      
                      {report.status === 'resolved' && (
                        <div className="text-center py-2 text-sm text-gray-500">
                          Work completed
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

      <SafetyCheckModal
        isOpen={safetyModalOpen}
        onClose={() => setSafetyModalOpen(false)}
        onSuccess={handleSafetyCheckSuccess}
        reportId={selectedReport}
        newStatus={pendingStatus}
      />
    </div>
  );
};

export default WorkerDashboard;