export interface IGarbageReport {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface UploadResponse {
  secure_url: string;
  public_id: string;
}