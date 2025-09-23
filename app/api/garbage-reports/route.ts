import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GarbageReport, { IGarbageReportDocument } from '@/models/GarbageReport';
import mongoose from 'mongoose';

interface Location {
  latitude: number;
  longitude: number;
}

interface GarbageReportResponse {
  _id: string;
  image: string;
  location: Location;
  city: string;
  address?: string;
  reportedBy?: string;
  status: 'pending' | 'in-progress' | 'resolved';
  accuracy?: number;
  locationSource: 'gps' | 'network' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

interface CreateReportRequest {
  image: string;
  location: Location;
  city: string;
  address?: string;
  reportedBy?: string;
  accuracy?: number;
  locationSource?: 'gps' | 'network' | 'manual';
}

interface UpdateReportRequest {
  reportId: string;
  status?: 'pending' | 'in-progress' | 'resolved';
  address?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: string | string[];
}

const isValidStatus = (status: string): status is 'pending' | 'in-progress' | 'resolved' => {
  return ['pending', 'in-progress', 'resolved'].includes(status);
};

const isValidLocationSource = (source: string): source is 'gps' | 'network' | 'manual' => {
  return ['gps', 'network', 'manual'].includes(source);
};

const transformReport = (report: any): GarbageReportResponse => ({
  _id: report._id?.toString() || '',
  image: report.image || '',
  location: {
    latitude: report.location?.latitude || 0,
    longitude: report.location?.longitude || 0,
  },
  city: report.city || '',
  address: report.address || undefined,
  reportedBy: report.reportedBy?.toString() || undefined,
  status: report.status || 'pending',
  accuracy: report.accuracy || undefined,
  locationSource: report.locationSource || 'network',
  createdAt: report.createdAt || new Date(),
  updatedAt: report.updatedAt || new Date(),
});

const createErrorResponse = (
  error: string, 
  details?: string | string[], 
  status: number = 500
): NextResponse => {
  console.error(`API Error (${status}):`, error, details);
  
  const response: ApiResponse = {
    success: false,
    error,
    ...(details && { details })
  };
  
  return NextResponse.json(response, { 
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    }
  });
};

const createSuccessResponse = <T>(
  data: T, 
  message?: string, 
  status: number = 200
): NextResponse => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  };
  
  return NextResponse.json(response, { 
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    }
  });
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('Starting GET request for garbage reports');
    
    const dbConnection = await Promise.race([
      connectDB(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 10000)
      )
    ]);

    if (!dbConnection) {
      return createErrorResponse('Database connection failed', undefined, 503);
    }

    const { searchParams } = new URL(request.url);
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20') || 20), 100);
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const reportedBy = searchParams.get('reportedBy');
    
    const latitude = parseFloat(searchParams.get('latitude') || '0') || 0;
    const longitude = parseFloat(searchParams.get('longitude') || '0') || 0;
    const radius = Math.max(0, parseFloat(searchParams.get('radius') || '0') || 0);

    const query: Record<string, any> = {};
    
    if (status) {
      if (!isValidStatus(status)) {
        return createErrorResponse('Invalid status value', 'Status must be pending, in-progress, or resolved', 400);
      }
      query.status = status;
    }
    
    if (city && city.trim()) {
      query.city = { $regex: city.trim(), $options: 'i' };
    }
    
    if (reportedBy && reportedBy.trim()) {
      const trimmedReportedBy = reportedBy.trim();
      try {
        if (mongoose.Types.ObjectId.isValid(trimmedReportedBy) && trimmedReportedBy.length === 24) {
          query.$or = [
            { reportedBy: trimmedReportedBy },
            { reportedBy: new mongoose.Types.ObjectId(trimmedReportedBy) }
          ];
        } else {
          query.reportedBy = trimmedReportedBy;
        }
      } catch (error) {
        query.reportedBy = trimmedReportedBy;
      }
    }
    
    if (latitude !== 0 && longitude !== 0 && radius > 0) {
      if (latitude < -90 || latitude > 90) {
        return createErrorResponse('Invalid latitude', 'Latitude must be between -90 and 90', 400);
      }
      if (longitude < -180 || longitude > 180) {
        return createErrorResponse('Invalid longitude', 'Longitude must be between -180 and 180', 400);
      }
      
      const radiusInRadians = radius / 6371;
      query['location'] = {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRadians]
        }
      };
    }

    const validSortFields = ['createdAt', 'updatedAt', 'status', 'city'];
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const actualSortOrder = sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [actualSortBy]: actualSortOrder };

    const skip = (page - 1) * limit;

    const [reports, totalCount] = await Promise.all([
      GarbageReport
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      GarbageReport.countDocuments(query)
    ]);

    if (!Array.isArray(reports)) {
      return createErrorResponse('Invalid data format returned from database', undefined, 500);
    }

    const transformedReports = reports.map(report => {
      try {
        return transformReport(report);
      } catch (transformError) {
        console.error('Error transforming report:', transformError);
        return null;
      }
    }).filter(Boolean) as GarbageReportResponse[];

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    let statusCountsObj = {
      pending: 0,
      'in-progress': 0,
      resolved: 0,
      total: totalCount
    };

    try {
      const statusCounts = await GarbageReport.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      statusCounts.forEach((item: any) => {
        if (item._id && item._id in statusCountsObj) {
          statusCountsObj[item._id as keyof typeof statusCountsObj] = item.count;
        }
      });
    } catch (aggregateError) {
      console.error('Error getting status counts:', aggregateError);
    }

    const responseData = {
      reports: transformedReports,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit
      },
      statusCounts: statusCountsObj
    };

    return createSuccessResponse(responseData);

  } catch (error) {
    console.error('GET /api/garbage-reports error:', error);
    
    if (error instanceof mongoose.Error) {
      return createErrorResponse('Database error', error.message, 503);
    }
    
    return createErrorResponse(
      'Failed to fetch garbage reports',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: CreateReportRequest;
  
  try {
    console.log('Starting POST request for garbage report');
    
    const dbConnection = await Promise.race([
      connectDB(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 10000)
      )
    ]);

    if (!dbConnection) {
      return createErrorResponse('Database connection failed', undefined, 503);
    }

    try {
      const rawBody = await request.text();
      if (!rawBody || rawBody.trim() === '') {
        return createErrorResponse('Request body is empty', undefined, 400);
      }
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return createErrorResponse('Invalid JSON format in request body', 
        parseError instanceof Error ? parseError.message : 'JSON parsing failed', 400);
    }

    const { image, location, city, address, reportedBy, accuracy, locationSource } = body;

    if (!image || typeof image !== 'string' || !image.trim()) {
      return createErrorResponse('Image is required and must be a non-empty string', undefined, 400);
    }

    if (!location || typeof location !== 'object' || location === null) {
      return createErrorResponse('Location object is required', undefined, 400);
    }

    if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return createErrorResponse('Valid location with numeric latitude and longitude is required', undefined, 400);
    }

    if (isNaN(location.latitude) || isNaN(location.longitude)) {
      return createErrorResponse('Latitude and longitude must be valid numbers', undefined, 400);
    }

    if (!city || typeof city !== 'string' || !city.trim()) {
      return createErrorResponse('City is required and must be a non-empty string', undefined, 400);
    }

    if (location.latitude < -90 || location.latitude > 90) {
      return createErrorResponse('Latitude must be between -90 and 90', undefined, 400);
    }

    if (location.longitude < -180 || location.longitude > 180) {
      return createErrorResponse('Longitude must be between -180 and 180', undefined, 400);
    }

    if (accuracy !== undefined && (typeof accuracy !== 'number' || accuracy < 0 || isNaN(accuracy))) {
      return createErrorResponse('Accuracy must be a non-negative number', undefined, 400);
    }

    if (locationSource && !isValidLocationSource(locationSource)) {
      return createErrorResponse('Location source must be gps, network, or manual', undefined, 400);
    }

    if (address !== undefined && typeof address !== 'string') {
      return createErrorResponse('Address must be a string', undefined, 400);
    }

    if (reportedBy !== undefined && typeof reportedBy !== 'string') {
      return createErrorResponse('ReportedBy must be a string', undefined, 400);
    }

    const reportData = {
      image: image.trim(),
      location: {
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
      },
      city: city.trim(),
      address: address?.trim() || undefined,
      reportedBy: reportedBy?.trim() || undefined,
      status: 'pending' as const,
      accuracy: accuracy ? Number(accuracy) : undefined,
      locationSource: locationSource || 'network' as const,
    };

    const newReport = new GarbageReport(reportData);
    const savedReport = await newReport.save();

    if (!savedReport) {
      return createErrorResponse('Failed to save report to database', undefined, 500);
    }

    const transformedReport = transformReport(savedReport.toObject());

    return createSuccessResponse(
      { report: transformedReport },
      'Garbage report created successfully',
      201
    );

  } catch (error) {
    console.error('POST /api/garbage-reports error:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return createErrorResponse('Validation failed', validationErrors, 400);
    }

    if (error instanceof mongoose.Error.CastError) {
      return createErrorResponse('Invalid data format', error.message, 400);
    }

    if (error instanceof mongoose.MongooseError) {
      return createErrorResponse('Database error', error.message, 503);
    }

    return createErrorResponse(
      'Failed to create garbage report',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  let body: UpdateReportRequest;
  
  try {
    console.log('Starting PATCH request for garbage report');
    
    const dbConnection = await Promise.race([
      connectDB(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 10000)
      )
    ]);

    if (!dbConnection) {
      return createErrorResponse('Database connection failed', undefined, 503);
    }

    try {
      const rawBody = await request.text();
      if (!rawBody || rawBody.trim() === '') {
        return createErrorResponse('Request body is empty', undefined, 400);
      }
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return createErrorResponse('Invalid JSON format in request body', 
        parseError instanceof Error ? parseError.message : 'JSON parsing failed', 400);
    }

    const { reportId, status, address } = body;

    if (!reportId || typeof reportId !== 'string' || !reportId.trim()) {
      return createErrorResponse('Report ID is required and must be a non-empty string', undefined, 400);
    }

    const trimmedReportId = reportId.trim();
    if (!mongoose.Types.ObjectId.isValid(trimmedReportId)) {
      return createErrorResponse('Invalid report ID format', undefined, 400);
    }

    const updateObj: Record<string, any> = {};
    
    if (status !== undefined) {
      if (!isValidStatus(status)) {
        return createErrorResponse('Status must be pending, in-progress, or resolved', undefined, 400);
      }
      updateObj.status = status;
    }
    
    if (address !== undefined) {
      if (typeof address !== 'string') {
        return createErrorResponse('Address must be a string', undefined, 400);
      }
      updateObj.address = address.trim() || '';
    }

    if (Object.keys(updateObj).length === 0) {
      return createErrorResponse('No valid fields to update', undefined, 400);
    }

    const updatedReport = await GarbageReport.findByIdAndUpdate(
      trimmedReportId,
      updateObj,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedReport) {
      return createErrorResponse('Report not found', undefined, 404);
    }

    const transformedReport = transformReport(updatedReport);

    return createSuccessResponse(
      { report: transformedReport },
      'Report updated successfully'
    );

  } catch (error) {
    console.error('PATCH /api/garbage-reports error:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return createErrorResponse('Validation failed', validationErrors, 400);
    }

    if (error instanceof mongoose.Error.CastError) {
      return createErrorResponse('Invalid data format', error.message, 400);
    }

    if (error instanceof mongoose.MongooseError) {
      return createErrorResponse('Database error', error.message, 503);
    }

    return createErrorResponse(
      'Failed to update garbage report',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}