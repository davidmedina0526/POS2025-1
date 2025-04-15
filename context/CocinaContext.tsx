import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../utils/FireBaseConfig';
import { collection, doc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { Order } from '../interfaces/Order';

interface CookContextType {
  orders: Order[];
  loadOrders: () => void; // Puedes conservarla si necesitas una carga manual
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

  // Función para carga manual en caso de que la necesites
  const loadOrders = async () => {
    // Puedes dejarla para un refresco manual o eliminarla si decides utilizar solo la suscripción en tiempo real.
  };

  // Actualizar el estado de la orden en la base de datos
  const updateOrderStatus = async (orderId: string, status: 'pendiente' | 'en preparación' | 'listo' | 'cancelado') => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
    // La actualización se reflejará automáticamente en el array de órdenes gracias a la suscripción en tiempo real
  };

  // Calcular el tiempo transcurrido desde la creación de la orden
  const calculateTimeSinceOrder = (orderTimestamp: Timestamp): number => {
    const currentTimestamp = Timestamp.now();
    const differenceInSeconds = currentTimestamp.seconds - orderTimestamp.seconds;
    return differenceInSeconds;
  };

  // Suscripción en tiempo real a la colección "orders"
  useEffect(() => {
    const ordersCollection = collection(db, 'orders');
    const unsubscribe = onSnapshot(ordersCollection, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        // Filtrar solo órdenes que están pendientes o en preparación
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

    // Limpieza de la suscripción cuando el componente se desmonte
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