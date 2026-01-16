export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Activity {
  id: string;
  time: string;
  name: string;
  description: string;
  location: string;
  price?: string;
  duration?: string;
  type: 'activity' | 'meal' | 'travel' | 'accommodation';
  imageUrl?: string;
  openingHours?: string;
  bookingInfo?: string; 
  rating?: number;
  coordinates?: Coordinates;
}

export interface Accommodation {
  id: string; 
  name: string;
  description: string;
  price: string;
  location: string;
  bookingLink?: string;
  imageUrl?: string;
  coordinates?: Coordinates;
}

export interface DayPlan {
  dayNumber: number;
  summary: string;
  accommodation: Accommodation;
  activities: Activity[];
  stats: {
    totalTravelTime: string;
    totalCost: string;
    activityCount: number;
  };
}

export interface Itinerary {
  destination: string;
  duration: number;
  travelers: number;
  hasChildren: boolean;
  interests: string[];
  days: DayPlan[];
}

export interface UserPreferences {
  destination: string;
  duration: number;
  travelers: number;
  hasChildren: boolean;
  interests: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  image?: string; 
}