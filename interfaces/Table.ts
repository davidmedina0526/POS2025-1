export interface Table {
    id: string; // ID de firebase
    status: 'disponible' | 'no disponible'; // Estado de la mesa
    orderId?: string; // ID de la orden asociada, puede ser null si no hay orden
    total: number; // Total de lo que se ha pedido en la mesa
  }
  