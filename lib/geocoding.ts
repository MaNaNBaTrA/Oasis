interface NominatimResponse {
  display_name: string;
  lat: string;
  lon: string;
}

export const reverseGeocode = async (
  latitude: number, 
  longitude: number
): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'User-Agent': 'GarbageReportApp/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data: NominatimResponse = await response.json();
    return data.display_name || 'Address not found';
  } catch (error) {
    console.error('Error getting address:', error);
    return 'Address unavailable';
  }
};