"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import dynamic from 'next/dynamic';
import { MapPin, Shield, Camera, Brain, Recycle, Users, CheckCircle, Clock, AlertTriangle, ArrowRight, Star } from 'lucide-react';
import { IGarbageReport } from '@/types';

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

interface GarbageReportsApiResponse {
  success: boolean;
  data: {
    reports: IGarbageReport[];
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

const Homepage: React.FC = () => {
  const [reports, setReports] = useState<IGarbageReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0,
    total: 0
  });

  useEffect(() => {
    fetchRecentReports();
  }, []);

  const fetchRecentReports = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/garbage-reports?limit=20&sortBy=createdAt&sortOrder=desc');
      
      if (response.ok) {
        const data: GarbageReportsApiResponse = await response.json();
        
        if (data.success && data.data && data.data.reports) {
          setReports(data.data.reports);
          setStatusCounts({
            pending: data.data.statusCounts.pending || 0,
            inProgress: data.data.statusCounts['in-progress'] || 0,
            resolved: data.data.statusCounts.resolved || 0,
            total: data.data.statusCounts.total || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: MapPin,
      title: "GPS & Manual Reporting",
      description: "Report garbage using precise GPS coordinates or manually select locations on the interactive map",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Shield,
      title: "AI Safety Verification",
      description: "Workers must verify safety gear (gloves, mask, helmet) through AI photo verification before cleanup",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Camera,
      title: "Photo Documentation",
      description: "Visual evidence with before/after photos for transparency and progress tracking",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: Brain,
      title: "Waste Classifier",
      description: "AI-powered guidance helps users identify the correct disposal method for different waste types",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const benefits = [
    {
      icon: Users,
      title: "Community Engagement",
      description: "Citizens actively participate in keeping their neighborhoods clean"
    },
    {
      icon: CheckCircle,
      title: "Real-time Tracking",
      description: "Track report status from submission to resolution"
    },
    {
      icon: Recycle,
      title: "Sustainable Solutions",
      description: "Promote proper waste disposal and recycling practices"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden bg-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center text-gray-900">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-brand">
              Oasis
            </h1>
            <p className="text-xl md:text-2xl mb-8 leading-relaxed text-gray-600">
              A platform where citizens can easily raise garbage tickets using GPS or manual map selection, 
              track progress in real-time, and ensure safe cleanups with AI-verified safety protocols
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/raise-ticket"
                className="inline-flex items-center px-8 py-4 bg-brand text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                Report Garbage
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/waste-classifier"
                className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Waste Classifier
                <Brain className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-brand mb-2">{statusCounts.total}</div>
              <div className="text-gray-600">Total Reports</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">{statusCounts.pending}</div>
              <div className="text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">{statusCounts.inProgress}</div>
              <div className="text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{statusCounts.resolved}</div>
              <div className="text-gray-600">Resolved</div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform combines citizen reporting, AI verification, and real-time tracking 
              to create a smarter, safer waste management system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-6">
                <div className={`${feature.bgColor} p-4 rounded-xl`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Live Reports Map
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              View all garbage reports in real-time on our interactive map. Track status updates and see cleanup progress across your area.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-6xl mx-auto">
            <MapView reports={reports} height="500px" />
            
            <div className="mt-8 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {reports.length} recent reports
              </div>
              <Link
                href="/ticket-history"
                className="inline-flex items-center px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Reports
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                AI-Powered Safety Verification
              </h2>
              <p className="text-xl text-gray-600">
                Using Roboflow RefTDR technology to ensure worker safety during cleanup operations
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Gloves Detection</h3>
                  <p className="text-gray-600">AI verifies workers are wearing protective gloves</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Mask Verification</h3>
                  <p className="text-gray-600">Ensures proper face mask usage during cleanup</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Helmet Check</h3>
                  <p className="text-gray-600">Confirms safety helmet is worn for protection</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Benefits for Communities
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Together, we make garbage reporting smarter, safer, and more sustainable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <benefit.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of citizens working together to keep our communities clean and sustainable
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/raise-ticket"
              className="inline-flex items-center px-8 py-4 bg-brand text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              Start Reporting
              <Camera className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/training"
              className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Learn More
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;