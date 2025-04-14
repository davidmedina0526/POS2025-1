import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../utils/FireBaseConfig';
import { collection, doc, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { Order } from '../interfaces/Order';

interface CookContextType {
  orders: Order[];
  loadOrders: () => void;
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

  // Cargar órdenes desde Firestore (ordenes pendientes o en preparación)
  const loadOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersData: Order[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        // Asegúrate de que todos los campos necesarios estén presentes
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
    } catch (error) {
      console.error('Error al cargar las órdenes: ', error);
    }
  };

  // Actualizar estado de la orden
  const updateOrderStatus = async (orderId: string, status: 'pendiente' | 'en preparación' | 'listo' | 'cancelado') => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });

    // Actualizar la lista de órdenes
    loadOrders();
  };

  // Calcular el tiempo transcurrido desde que se realizó la orden
  const calculateTimeSinceOrder = (orderTimestamp: Timestamp): number => {
    const currentTimestamp = Timestamp.now();
    const differenceInMilliseconds = currentTimestamp.seconds - orderTimestamp.seconds;
    return differenceInMilliseconds; 
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <CookContext.Provider value={{ orders, loadOrders, updateOrderStatus, calculateTimeSinceOrder }}>
      {children}
    </CookContext.Provider>
  );
};