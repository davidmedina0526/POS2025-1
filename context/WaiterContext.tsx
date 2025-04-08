import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../utils/FireBaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  onSnapshot,
  Timestamp,
  deleteDoc, // Importar deleteDoc para eliminar documentos
} from 'firebase/firestore';
import { Table } from '../interfaces/Table'; // La interfaz Table debe incluir orderId si lo usarás
import { Order, OrderItem } from '../interfaces/Order';
import { MenuItem } from '../interfaces/MenuItem';

interface WaiterContextType {
  selectedTable: Table | null;
  tables: Table[];
  orders: Order[];
  selectTable: (tableId: string) => void;
  createOrder: (tableId: string, items: OrderItem[]) => void;
  getOrders: () => void;
  addOrderItem: (orderId: string, item: OrderItem) => void;
  updateOrderStatus: (orderId: string, status: 'pendiente' | 'en preparación' | 'listo' | 'cancelado') => void;
  loadTables: () => void;
  freeTable: (tableId: string) => Promise<void>; // Nueva función
}

const WaiterContext = createContext<WaiterContextType | undefined>(undefined);

export const useWaiterContext = () => {
  const context = useContext(WaiterContext);
  if (!context) {
    throw new Error('useWaiterContext must be used within a WaiterProvider');
  }
  return context;
};

interface WaiterProviderProps {
  children: React.ReactNode;
}

export const WaiterProvider: React.FC<WaiterProviderProps> = ({ children }) => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Función para cargar mesas (se puede usar en flujos manuales)
  const loadTables = async () => {
    const tablesQuery = query(collection(db, 'tables'));
    const querySnapshot = await getDocs(tablesQuery);
    const fetchedTables: Table[] = [];
    querySnapshot.forEach((docSnapshot) => {
      const tableData = docSnapshot.data();
      fetchedTables.push({
        id: docSnapshot.id,
        status: tableData.status,
        orderItems: tableData.orderItems || [],
        orderId: tableData.orderId || null, // Asegúrate de incluir este campo si lo usarás
      });
    });
    setTables(fetchedTables);
  };

  // Listener en tiempo real para actualizar las mesas automáticamente.
  useEffect(() => {
    const tablesRef = collection(db, 'tables');
    const unsubscribeTables = onSnapshot(tablesRef, (snapshot) => {
      const fetchedTables: Table[] = [];
      snapshot.forEach((docSnapshot) => {
        const tableData = docSnapshot.data();
        fetchedTables.push({
          id: docSnapshot.id,
          status: tableData.status,
          orderItems: tableData.orderItems || [],
          orderId: tableData.orderId || null,
        });
      });
      setTables(fetchedTables);
    });
    return () => unsubscribeTables();
  }, []);

  // Listener en tiempo real para la colección de órdenes:
  // Si se elimina una orden, actualizamos la mesa asociada para que vuelva a estar disponible.
  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          const removedOrder = change.doc.data() as Order;
          const tableRef = doc(db, 'tables', removedOrder.tableId);
          setDoc(tableRef, { 
            status: 'disponible',
            orderItems: [],
            orderId: null
          }, { merge: true });
        }
      });
    });
    return () => unsubscribeOrders();
  }, []);

  // Seleccionar mesa (actualiza el estado local)
  const selectTable = (tableId: string) => {
    const table = tables.find((table) => table.id === tableId);
    if (table) {
      setSelectedTable(table);
    }
  };

  // Crear una nueva orden y actualizar la mesa para reflejar que ya está ocupada
  const createOrder = async (tableId: string, items: OrderItem[]) => {
    const orderRef = doc(collection(db, 'orders'));
    const newOrder: Order = {
      id: orderRef.id,
      tableId,
      items,
      total: items.reduce((acc, item) => acc + item.price * item.quantity, 0),
      status: 'pendiente',
      createdAt: Timestamp.now(),
    };
    await setDoc(orderRef, newOrder);
    setOrders((prevOrders) => [...prevOrders, newOrder]);

    await setDoc(doc(db, 'tables', tableId), { 
      status: 'no disponible',
      orderId: newOrder.id,       // Se asigna el id de la orden
      orderItems: newOrder.items, // Se almacenan también los items de la orden si se requiere
    }, { merge: true });
  };

  // Obtener todas las órdenes (este método se puede usar en flujos que no requieran real-time)
  const getOrders = async () => {
    const ordersQuery = query(collection(db, 'orders'));
    const querySnapshot = await getDocs(ordersQuery);
    const fetchedOrders: Order[] = [];
    querySnapshot.forEach((docSnapshot) => {
      fetchedOrders.push(docSnapshot.data() as Order);
    });
    setOrders(fetchedOrders);
  };

  // Agregar un ítem a una orden existente
  const addOrderItem = async (orderId: string, item: OrderItem) => {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
      const order = orderSnap.data() as Order;
      order.items.push(item);
      order.total += item.price * item.quantity;
      await setDoc(orderRef, order);
    }
  };

  // Actualizar el estado de una orden
  const updateOrderStatus = async (
    orderId: string,
    status: 'pendiente' | 'en preparación' | 'listo' | 'cancelado'
  ) => {
    const orderRef = doc(db, 'orders', orderId);
    await setDoc(orderRef, { status }, { merge: true });
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  // Nueva función para liberar la mesa y borrar la orden asociada
  const freeTable = async (tableId: string) => {
    const tableRef = doc(db, 'tables', tableId);
    const tableSnap = await getDoc(tableRef);
    if (tableSnap.exists()) {
      const tableData = tableSnap.data();
      if (tableData.orderId) {
        // Borrar la orden asociada
        await deleteDoc(doc(db, 'orders', tableData.orderId));
      }
      // Actualizar la mesa para que esté disponible
      await setDoc(
        tableRef,
        { status: 'disponible', orderId: null, orderItems: [] },
        { merge: true }
      );
    }
  };

  return (
    <WaiterContext.Provider
      value={{
        selectedTable,
        tables,
        orders,
        selectTable,
        createOrder,
        getOrders,
        addOrderItem,
        updateOrderStatus,
        loadTables,
        freeTable, // Se expone la función freeTable
      }}
    >
      {children}
    </WaiterContext.Provider>
  );
};