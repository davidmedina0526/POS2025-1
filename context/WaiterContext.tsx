import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../utils/FireBaseConfig'; // Asumiendo que tienes una configuración de Firebase
import { collection, doc, setDoc, getDocs, getDoc, query, where, Timestamp } from 'firebase/firestore';
import { Table } from '../interfaces/Table'; // Importa las interfaces de la base de datos
import { Order, OrderItem } from '../interfaces/Order'; // Importa las interfaces de la base de datos
import { MenuItem } from '../interfaces/MenuItem'; // Importa las interfaces de la base de datos

interface WaiterContextType {
  selectedTable: Table | null;
  tables: Table[]; // Ahora mantenemos las mesas en el estado
  orders: Order[];
  selectTable: (tableId: string) => void;
  createOrder: (tableId: string, items: OrderItem[]) => void;
  getOrders: () => void;
  addOrderItem: (orderId: string, item: OrderItem) => void;
  updateOrderStatus: (orderId: string, status: 'pendiente' | 'en preparación' | 'listo' | 'cancelado') => void;
  loadTables: () => void; // Función para cargar las mesas desde Firebase
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
  const [tables, setTables] = useState<Table[]>([]); // Estado para las mesas
  const [orders, setOrders] = useState<Order[]>([]);

  // Cargar mesas desde Firebase
  const loadTables = async () => {
    const tablesQuery = query(collection(db, 'tables'));
    const querySnapshot = await getDocs(tablesQuery);
    const fetchedTables: Table[] = [];
    querySnapshot.forEach((doc) => {
      const tableData = doc.data();
      fetchedTables.push({
        id: doc.id,
        status: tableData.status,
        orderId: tableData.orderId || null,
      });
    });
    setTables(fetchedTables);
  };

  // Seleccionar mesa
  const selectTable = (tableId: string) => {
    const table = tables.find((table) => table.id === tableId);
    if (table) {
      setSelectedTable(table);
    }
  };

  // Crear una nueva orden
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

    // Actualizar mesa con el id de la orden
    await setDoc(doc(db, 'tables', tableId), { orderId: newOrder.id }, { merge: true });
  };

  // Obtener todas las órdenes de la base de datos
  const getOrders = async () => {
    const ordersQuery = query(collection(db, 'orders'));
    const querySnapshot = await getDocs(ordersQuery);
    const fetchedOrders: Order[] = [];
    querySnapshot.forEach((doc) => {
      fetchedOrders.push(doc.data() as Order);
    });
    setOrders(fetchedOrders);
  };

  // Agregar un ítem a una orden
  const addOrderItem = async (orderId: string, item: OrderItem) => {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
      const order = orderSnap.data() as Order;
      order.items.push(item);
      order.total += item.price * item.quantity;
      await setDoc(orderRef, order); // Actualizar la orden en la base de datos
    }
  };

  // Actualizar el estado de una orden
  const updateOrderStatus = async (orderId: string, status: 'pendiente' | 'en preparación' | 'listo' | 'cancelado') => {
    const orderRef = doc(db, 'orders', orderId);
    await setDoc(orderRef, { status }, { merge: true });
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  useEffect(() => {
    loadTables(); // Cargar las mesas al inicio
  }, []);

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
      }}
    >
      {children}
    </WaiterContext.Provider>
  );
};
