import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../utils/FireBaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  addDoc, 
  deleteDoc, 
  Timestamp,
} from 'firebase/firestore';
import { Order } from '../interfaces/Order';

interface CajaContextType {
  orders: Order[];
  loadOrders: () => void;
  moveToCompleteOrders: (orderId: string) => void;
}

const CajaContext = createContext<CajaContextType | undefined>(undefined);

export const CajaProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersData: Order[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'pendiente') {
          // Aquí estamos asignando las propiedades correctas para que coincidan con la interfaz Order
          const order: Order = {
            id: doc.id,
            tableId: data.tableId,
            items: data.items,
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

  const moveToCompleteOrders = async (orderId: string) => {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (orderSnap.exists()) {
      const orderData = orderSnap.data();

      // Mover la orden a la colección de "CompleteOrders"
      await addDoc(collection(db, 'CompleteOrders'), {
        ...orderData,
        completedAt: Timestamp.now(),
      });

      // Eliminar la orden original de la colección "orders"
      await deleteDoc(orderRef);

      // Refrescar las órdenes
      loadOrders();
    }
  };

  return (
    <CajaContext.Provider value={{ orders, loadOrders, moveToCompleteOrders }}>
      {children}
    </CajaContext.Provider>
  );
};

export const useCaja = (): CajaContextType => {
  const context = useContext(CajaContext);
  if (!context) {
    throw new Error('useCaja debe ser usado dentro de un CajaProvider');
  }
  return context;
};
