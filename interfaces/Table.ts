import { OrderItem } from "./OrderItem";

export interface Table {
  id: string;
  status: 'disponible' | 'no disponible';
  orderItems?: OrderItem[];
  orderId?: string; // Se agrega esta propiedad
}