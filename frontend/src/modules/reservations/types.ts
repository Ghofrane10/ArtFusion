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