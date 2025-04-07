import { Timestamp } from 'firebase/firestore';

export interface Sale {
  id: string; // ID único para la venta
  orderId: string; // ID de la orden asociada
  tableId: string; // ID de la mesa
  items: SaleItem[]; // Elementos de la venta
  total: number; // Total de la venta
  paymentMethod: 'efectivo' | 'tarjeta' | 'otro'; // Método de pago
  saleDate: Timestamp; // Fecha y hora de la venta
}

export interface SaleItem {
  menuItemId: string; // ID del menú del ítem vendido
  quantity: number; // Cantidad vendida
  price: number; // Precio del ítem
}
