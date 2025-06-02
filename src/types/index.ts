export interface FirstPerformance {
  date: string;
  place: string;
}

export interface Opera {
  id: string;
  title: string;
  composer: string; // This could be a Composer object if we fetch composer details separately
  synopsis?: string;
  firstPerformance?: FirstPerformance;
  imageUrl?: string;
  // Raw fields from OpenOpus, in case we need them
  genre?: string;
  epoch?: string;
  // When fetched from OpenOpus work/list/composer, it has a composer object
  composerInfo?: Composer; 
}

export interface Composer {
  id: string;
  name: string;
  complete_name?: string;
  birth?: string;
  death?: string;
  epoch?: string;
  portrait?: string; // URL
}

// For the store
export interface WishlistOpera {
  id?: string; // Database ID, optional on client before save
  operaId: string;
  userId?: string; // Will be present when fetched from DB
  addedDate?: Date | string; // Will be present when fetched from DB
  title?: string;
  composer?: string;
}

export interface WatchedOpera {
  id?: string; // Database ID, will be present when fetched from DB or after creation
  operaId: string;
  userId?: string; // Will be present when fetched from DB
  rating: number; 
  date: string | Date; // Accept string or Date, store will handle conversion if necessary for API
  venue?: string;
  cast?: { role: string; artist: string }[];
  comments?: { id: string; author: string; date: string; text: string }[];
  title?: string;
  composer?: string;
} 