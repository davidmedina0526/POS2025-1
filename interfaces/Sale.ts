import { Timestamp } from 'firebase/firestore'; 

export interface Sale {
    id: string; // ID único para la venta
    userId: string; // ID del usuario que realizó la venta (generalmente mesero o caja)
    items: SaleItem[]; // Productos vendidos
    total: number; // Monto total de la venta
    paymentMethod: 'efectivo' | 'tarjeta' | 'otro'; // Método de pago
    saleDate: Timestamp; // Fecha y hora de la venta
  }
  
  export interface SaleItem {
    menuItemId: string; // ID del plato vendido
    quantity: number; // Cantidad del plato
    price: number; // Precio del plato
  }
  