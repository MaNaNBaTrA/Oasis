import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb'; 
import mongoose from 'mongoose';

const GarbageReportSchema = new mongoose.Schema({
  image: String,
  location: {
    latitude: Number,
    longitude: Number,
  },
  city: String,
  address: String,
  reportedBy: String,
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved'],
    default: 'pending'
  },
  accuracy: Number,
  locationSource: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const GarbageReport = mongoose.models.GarbageReport || mongoose.model('GarbageReport', GarbageReportSchema);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();
    const reportId = params.id;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    if (!['pending', 'in-progress', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const updateResult = await GarbageReport.findByIdAndUpdate(
      reportId,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updateResult) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report status updated successfully',
      data: updateResult
    });

  } catch (error) {
    console.error('Error updating report status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}