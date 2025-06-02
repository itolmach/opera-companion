export interface Opera {
  id: string;
  title: string;
  composer: string;
  synopsis: string;
  firstPerformance: {
    date: string;
    place: string;
  };
  imageUrl: string;
}

export interface WatchedOpera {
  id: string;
  operaId: string;
  rating: 1 | 2 | 3;
  date: string;
  venue: string;
  cast: {
    name: string;
    role: string;
  }[];
  comments: {
    id: string;
    text: string;
    author: string;
    date: string;
  }[];
}

export interface WishlistOpera {
  id: string;
  operaId: string;
  addedDate: string;
}

export type Rating = 1 | 2 | 3; 