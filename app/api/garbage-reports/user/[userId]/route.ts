import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GarbageReport from '@/models/GarbageReport';
import mongoose from 'mongoose';

interface LocationData {
  latitude: number;
  longitude: number;
}

interface LeanGarbageReport {
  _id?: mongoose.Types.ObjectId | string;
  image?: string;
  location?: LocationData;
  city?: string;
  address?: string;
  reportedBy?: string | mongoose.Types.ObjectId;
  status?: 'pending' | 'in-progress' | 'resolved';
  accuracy?: number;
  locationSource?: 'gps' | 'network' | 'manual';
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
  [key: string]: any; 
}

interface TransformedReport {
  _id: string;
  image: string;
  location: LocationData;
  city: string;
  address?: string;
  reportedBy?: string;
  status: 'pending' | 'in-progress' | 'resolved';
  accuracy?: number;
  locationSource?: 'gps' | 'network' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

interface StatusCounts {
  pending: number;
  'in-progress': number;
  resolved: number;
  total: number;
}

interface ApiSuccessResponse {
  success: true;
  data: {
    reports: TransformedReport[];
    statusCounts: StatusCounts;
  };
}

interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

interface RouteContext {
  params: Promise<{
    userId: string;
  }>;
}

const VALID_STATUSES = ['pending', 'in-progress', 'resolved'] as const;
const VALID_SORT_FIELDS = ['createdAt', 'updatedAt', 'status'] as const;
const VALID_SORT_ORDERS = ['asc', 'desc'] as const;

type ValidStatus = typeof VALID_STATUSES[number];
type ValidSortField = typeof VALID_SORT_FIELDS[number];
type ValidSortOrder = typeof VALID_SORT_ORDERS[number];

function isValidStatus(status: string): status is ValidStatus {
  return VALID_STATUSES.includes(status as ValidStatus);
}

function isValidSortField(field: string): field is ValidSortField {
  return VALID_SORT_FIELDS.includes(field as ValidSortField);
}

function isValidSortOrder(order: string): order is ValidSortOrder {
  return VALID_SORT_ORDERS.includes(order as ValidSortOrder);
}

function buildUserQuery(userId: string): Record<string, any> {
  const queries = [];
  
  if (mongoose.Types.ObjectId.isValid(userId) && userId.length === 24) {
    queries.push(
      { reportedBy: userId },
      { reportedBy: new mongoose.Types.ObjectId(userId) },
      { userEmail: userId },
      { userId: userId }
    );
  } else {
    queries.push(
      { reportedBy: userId },
      { userEmail: userId },
      { userId: userId }
    );
  }
  
  return { $or: queries };
}

function transformReport(report: LeanGarbageReport): TransformedReport {
  return {
    _id: report._id?.toString() || '',
    image: report.image || '',
    location: {
      latitude: report.location?.latitude || 0,
      longitude: report.location?.longitude || 0,
    },
    city: report.city || '',
    address: report.address,
    reportedBy: report.reportedBy?.toString(),
    status: report.status || 'pending',
    accuracy: report.accuracy,
    locationSource: report.locationSource || 'network',
    createdAt: report.createdAt || new Date(),
    updatedAt: report.updatedAt || new Date(),
  };
}

function calculateStatusCounts(reports: TransformedReport[]): StatusCounts {
  return {
    pending: reports.filter(r => r.status === 'pending').length,
    'in-progress': reports.filter(r => r.status === 'in-progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    total: reports.length
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB();

    const { userId } = await context.params;
    const { searchParams } = new URL(request.url);
    
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required and must be a string',
        },
        { status: 400 }
      );
    }

    const limitParam = searchParams.get('limit');
    const statusParam = searchParams.get('status');
    const sortByParam = searchParams.get('sortBy');
    const sortOrderParam = searchParams.get('sortOrder');
    const debugParam = searchParams.get('debug') === 'true';
    
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 100, 1), 500) : 100;
    const sortBy: ValidSortField = sortByParam && isValidSortField(sortByParam) ? sortByParam : 'createdAt';
    const sortOrder: ValidSortOrder = sortOrderParam && isValidSortOrder(sortOrderParam) ? sortOrderParam : 'desc';

    let query = buildUserQuery(userId);
    
    if (statusParam && isValidStatus(statusParam)) {
      query = {
        $and: [query, { status: statusParam }]
      };
    }

    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1
    };

    console.log('User ID:', userId);
    console.log('Query:', JSON.stringify(query, null, 2));

    const reports = await GarbageReport
      .find(query)
      .sort(sortOptions)
      .limit(limit)
      .lean<LeanGarbageReport[]>()
      .exec();

    console.log(`Found ${reports.length} reports for user ${userId}`);

    if (reports.length === 0) {
      const allReports = await GarbageReport.find({}).limit(10).lean<LeanGarbageReport[]>().exec();
      console.log('Total reports in database:', allReports.length);
      console.log('Sample reports:', allReports.map(r => ({ 
        _id: r._id, 
        reportedBy: r.reportedBy,
        userEmail: (r as any).userEmail,
        userId: (r as any).userId,
        status: r.status 
      })));
      
      if (debugParam) {
        return NextResponse.json({
          success: true,
          data: {
            reports: allReports.map(transformReport),
            statusCounts: calculateStatusCounts(allReports.map(transformReport))
          },
        });
      }
    }

    const transformedReports = reports.map(transformReport);
    const statusCounts = calculateStatusCounts(transformedReports);

    return NextResponse.json({
      success: true,
      data: {
        reports: transformedReports,
        statusCounts
      },
    });

  } catch (error) {
    console.error('Error fetching user reports:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      error
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user reports',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}