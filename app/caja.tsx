import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../utils/FireBaseConfig';
import { collection, getDocs, addDoc, doc, deleteDoc, Timestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Order, OrderItem } from '../interfaces/Order'; // Asegúrate de importar también OrderItem

export default function CajaScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar órdenes pendientes desde la base de datos
  const loadOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersData: Order[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'pendiente') {
          // Asegurémonos de que todas las propiedades de la orden se asignen correctamente
          const order: Order = {
            id: doc.id, // El id de la orden
            tableId: data.tableId, // ID de la mesa
            items: data.items, // Los elementos de la orden
            total: data.total, // Total de la orden
            status: data.status, // Estado de la orden
            createdAt: data.createdAt, // Fecha de creación
          };
          ordersData.push(order);
        }
      });
      setOrders(ordersData);
    } catch (error) {
      console.error('Error al cargar las órdenes: ', error);
    } finally {
      setLoading(false);
    }
  };

  // Mover una orden a CompleteOrders
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

      // Actualizar el estado de las órdenes
      loadOrders(); // Refrescar las órdenes
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#347FC2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de Caja</Text>
      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <Text>Orden ID: {item.id}</Text>
            <Text>Total: ${item.total}</Text>
            {/* Aquí mostramos los ítems de la orden */}
            <Text style={styles.itemsTitle}>Ítems de la Orden:</Text>
            <FlatList
              data={item.items}
              renderItem={({ item: orderItem }) => (
                <View style={styles.itemCard}>
                  <Text>Plato: {orderItem.name}</Text>
                  <Text>Cantidad: {orderItem.quantity}</Text>
                  <Text>Precio: ${orderItem.price}</Text>
                </View>
              )}
              keyExtractor={(item, index) => `${item.menuItemId}-${index}`}
            />
            <Button title="Pagar" onPress={() => moveToCompleteOrders(item.id)} />
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF' 
  },
  title: { 
    color: '#347FC2',
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 20,
  },
  orderCard: {
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  itemsTitle: {
    marginTop: 10,
    fontWeight: 'bold',
    color: '#347FC2',
  },
  itemCard: {
    padding: 5,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
});
