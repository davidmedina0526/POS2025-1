import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../utils/FireBaseConfig';
import { collection, doc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { Order } from '../interfaces/Order';

interface CookContextType {
  orders: Order[];
  loadOrders: () => void; // Disponible si se quiere forzar carga manual
  updateOrderStatus: (orderId: string, status: 'pendiente' | 'en preparación' | 'listo' | 'cancelado') => void;
  calculateTimeSinceOrder: (createdAt: Timestamp) => number;
}

const CookContext = createContext<CookContextType | undefined>(undefined);

export const useCookContext = () => {
  const context = useContext(CookContext);
  if (!context) {
    throw new Error('useCookContext debe ser usado dentro de un CookProvider');
  }
  return context;
};

export const CookProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  // Función para carga manual (si se quiere usar desde otro componente)
  const loadOrders = () => {
    // Intencionalmente vacía porque usamos onSnapshot (tiempo real)
  };

  // Actualizar el estado de una orden
  const updateOrderStatus = async (
    orderId: string,
    status: 'pendiente' | 'en preparación' | 'listo' | 'cancelado'
  ) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
    // No necesitamos llamar loadOrders porque la suscripción ya lo actualizará
  };

  // Calcular tiempo desde que se creó la orden
  const calculateTimeSinceOrder = (orderTimestamp: Timestamp): number => {
    const now = Timestamp.now();
    return now.seconds - orderTimestamp.seconds;
  };

  // Suscripción en tiempo real a Firestore
  useEffect(() => {
    const ordersCollection = collection(db, 'orders');
    const unsubscribe = onSnapshot(ordersCollection, (snapshot) => {
      const ordersData: Order[] = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        // Solo cargar órdenes activas
        if (data.status === 'pendiente' || data.status === 'en preparación') {
          const order: Order = {
            id: docSnapshot.id,
            tableId: data.tableId,
            items: data.items || [],
            total: data.total,
            status: data.status,
            createdAt: data.createdAt,
          };
          ordersData.push(order);
        }
      });

      setOrders(ordersData);
    });

    // Limpiar suscripción al desmontar
    return () => unsubscribe();
  }, []);

  return (
    <CookContext.Provider
      value={{
        orders,
        loadOrders,
        updateOrderStatus,
        calculateTimeSinceOrder,
      }}
    >
      {children}
    </CookContext.Provider>
  );
};
