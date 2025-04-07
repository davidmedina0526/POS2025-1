import { Timestamp } from 'firebase/firestore';

export interface Order {
  id: string;
  tableId: string; // ID de la mesa
  items: OrderItem[]; // Elementos de la orden
  total: number; // Total de la orden
  status: 'pendiente' | 'en preparación' | 'listo' | 'cancelado'; // Estado de la orden
  createdAt: Timestamp; // Fecha de creación de la orden
}

export interface OrderItem {
  menuItemId: string; // ID del menú
  quantity: number; // Cantidad del ítem
  price: number; // Precio del ítem
}
