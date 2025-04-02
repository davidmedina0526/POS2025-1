export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: 'entrada' | 'plato principal' | 'postre' | 'bebida';
    imageUrl?: string;
  }
  