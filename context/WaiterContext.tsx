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
} from 'firebase/firestore';
import { Table } from '../interfaces/Table';
import { Order, OrderItem } from '../interfaces/Order';

interface WaiterContextType {
  selectedTable: Table | null;
  tables: Table[];
  orders: Order[];
  selectTable: (tableId: string) => void;
  createOrder: (tableId: string, items: OrderItem[]) => void;
  getOrders: () => void; // Agregado getOrders
  addOrderItem: (orderId: string, item: OrderItem) => void;
  updateOrderStatus: (orderId: string, status: 'pendiente' | 'en preparación' | 'listo' | 'cancelado') => void;
  loadTables: () => void;
  freeTable: (tableId: string) => Promise<void>;
  showPopup: boolean;
  orderForPopup: Order | null;
  setShowPopup: (show: boolean) => void;
}

const WaiterContext = createContext<WaiterContextType | undefined>(undefined);

export const useWaiterContext = () => {
  const context = useContext(WaiterContext);
  if (!context) {
    throw new Error('useWaiterContext must be used within a WaiterProvider');
  }
  return context;
};

export const WaiterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [orderForPopup, setOrderForPopup] = useState<Order | null>(null);

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
        orderId: tableData.orderId || null,
      });
    });
    setTables(fetchedTables);
  };

  // Función para cargar órdenes (agregada)
  const getOrders = async () => {
    const ordersQuery = query(collection(db, 'orders'));
    const querySnapshot = await getDocs(ordersQuery);
    const fetchedOrders: Order[] = [];
    querySnapshot.forEach((docSnapshot) => {
      fetchedOrders.push(docSnapshot.data() as Order);
    });
    setOrders(fetchedOrders);
  };

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      snapshot.forEach((docSnapshot) => {
        const orderData = docSnapshot.data();
        if (orderData.status === 'listo') {
          const order: Order = {
            id: docSnapshot.id,
            tableId: orderData.tableId,
            items: orderData.items || [],
            total: orderData.total,
            status: orderData.status,
            createdAt: orderData.createdAt,
          };
          setOrderForPopup(order);
          setShowPopup(true);
        }
      });
    });

    return () => unsubscribeOrders();
  }, []);

  const selectTable = (tableId: string) => {
    const table = tables.find((table) => table.id === tableId);
    if (table) {
      setSelectedTable(table);
    }
  };

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
      orderId: newOrder.id,
      orderItems: newOrder.items,
    }, { merge: true });
  };

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

  const updateOrderStatus = async (orderId: string, status: 'pendiente' | 'en preparación' | 'listo' | 'cancelado') => {
    const orderRef = doc(db, 'orders', orderId);
    await setDoc(orderRef, { status }, { merge: true });
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  const freeTable = async (tableId: string) => {
    const tableRef = doc(db, 'tables', tableId);
    const tableSnap = await getDoc(tableRef);
    if (tableSnap.exists()) {
      const tableData = tableSnap.data();
      if (tableData.orderId) {
        await setDoc(tableRef, { status: 'disponible', orderId: null, orderItems: [] }, { merge: true });
      }
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
        addOrderItem,
        updateOrderStatus,
        loadTables,
        freeTable,
        showPopup,
        orderForPopup,
        setShowPopup,
        getOrders, // Agregado getOrders
      }}
    >
      {children}
    </WaiterContext.Provider>
  );
};