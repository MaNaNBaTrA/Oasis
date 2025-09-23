import mongoose, { Document, Schema } from 'mongoose';

export interface IGarbageReport {
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
  locationSource: 'gps' | 'network' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

export interface IGarbageReportDocument extends IGarbageReport, Document {}

const GarbageReportSchema = new Schema<IGarbageReportDocument>(
  {
    image: {
      type: String,
      required: [true, 'Image is required'],
      trim: true,
    },
    location: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      },
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    reportedBy: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved'],
      default: 'pending',
    },
    accuracy: {
      type: Number,
      min: [0, 'Accuracy cannot be negative'],
    },
    locationSource: {
      type: String,
      enum: ['gps', 'network', 'manual'],
      default: 'network',
    },
  },
  {
    timestamps: true,
  }
);

GarbageReportSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
GarbageReportSchema.index({ city: 1 });
GarbageReportSchema.index({ status: 1 });
GarbageReportSchema.index({ createdAt: -1 });

const GarbageReport = mongoose.models.GarbageReport || 
  mongoose.model<IGarbageReportDocument>('GarbageReport', GarbageReportSchema);

export default GarbageReport;