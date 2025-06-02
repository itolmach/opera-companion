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
  operaId: string;
  // Potentially store a snapshot of the opera title/composer for quick display
  title?: string;
  composer?: string;
}

export interface WatchedOpera {
  operaId: string;
  rating: number; // e.g., 1-5 stars
  date: string; // ISO date string
  venue?: string;
  cast?: { role: string; artist: string }[];
  comments?: { id: string; author: string; date: string; text: string }[];
  // Potentially store a snapshot of the opera title/composer for quick display
  title?: string;
  composer?: string;
} 