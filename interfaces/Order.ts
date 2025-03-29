import { Timestamp } from 'firebase/firestore'; 

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pendiente' | 'en preparación' | 'listo' | 'cancelado';
  createdAt: Timestamp; // Usa Timestamp importado
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
}
