export interface Artwork {
  id: number;
  title: string;
  description: string;
  quantity_available: number;
  price: string;
  image: string | null;
  color_palette: string[] | null;
  created_at: string;
}

export interface Reservation {
  id: number;
  artwork: Artwork;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  quantity: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  created_at: string;
  notes?: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  category: 'Visiteur' | 'Artist';
  phone?: string;
  profile_picture?: string;
  artistic_nickname?: string;
}

export interface Comment {
  id: number;
  artwork: number;
  user: User;
  content: string;
  created_at: string;
  updated_at: string;
}