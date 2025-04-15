import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../utils/FireBaseConfig';
import { collection, getDocs, addDoc, doc, deleteDoc, Timestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Order } from '../interfaces/Order';

export default function CajaScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar órdenes pendientes desde la base de datos
  const loadOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersData: Order[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.status === 'listo') {
          // Asegurémonos de que todas las propiedades de la orden se asignen correctamente
          const order: Order = {
            id: docSnapshot.id,
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
      console.error('Error loading orders: ', error);
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
      loadOrders();

      // Mostrar mensaje de confirmación
      Alert.alert("¡Pago exitoso!", `La orden ${orderId} ha sido pagada y registrada correctamente.`);
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
      <Text style={styles.title}>Órdenes para pagar</Text>
      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <Text>Orden ID: {item.id}</Text>
            <Text>Total: ${item.total}</Text>

            <Text style={styles.itemsTitle}>Platos:</Text>
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

            <TouchableOpacity
              style={styles.payButton}
              onPress={async () => {
                await moveToCompleteOrders(item.id);
              }}
            >
              <Text style={styles.payButtonText}>Pagar</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          logout();
          router.replace('./');
        }}
      >
        <Image 
          source={require('../assets/images/salir.png')}
          style={{ width: 25, height: 25, marginRight: 10 }}
        />
        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>
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
    marginTop: 25,
    marginBottom: 30,
  },
  orderCard: {
    padding: 10,
    marginBottom: 60,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    alignSelf: 'center',
    width: '90%',
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
  payButton: {
    backgroundColor: '#347FC2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center'
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF'
  },
  logoutButton: {
    backgroundColor: '#DD1616',
    borderRadius: 5,
    marginTop: 15,
    marginBottom: 15,
    padding: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
