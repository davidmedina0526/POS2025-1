import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Image,
  Button
} from 'react-native';
import { useCookContext } from '../context/CocinaContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

export default function CookScreen() {
  const { user, logout } = useAuth();
  const { orders, updateOrderStatus, calculateTimeSinceOrder } = useCookContext();
  const [ time, setTime ] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime((prevState) => {
        const updatedTime = { ...prevState };
        orders.forEach((order) => {
          const timeInSeconds = calculateTimeSinceOrder(order.createdAt);
          updatedTime[order.id] = timeInSeconds;
        });
        return updatedTime;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [orders]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Órdenes en Cocina</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const timeInSeconds = time[item.id] || calculateTimeSinceOrder(item.createdAt);
          const isRed = timeInSeconds > 60;

          return (
            <View style={styles.orderCard}>
              <Text style={styles.orderText}>Orden ID: {item.id}</Text>
              <Text style={styles.orderText}>Estado: {item.status}</Text>
              
              <Text style={styles.itemsTitle}>Platos:</Text>
              {item.items.map((orderItem, index) => (
                <Text key={index} style={styles.itemText}>
                  {orderItem.quantity}x {orderItem.name}
                </Text>
              ))}

              <Text
                style={[
                  styles.timeText,
                  { color: isRed ? 'red' : 'black' },
                ]}
              >
                Tiempo en cocina: {timeInSeconds} seg
              </Text>

              {item.status === 'pendiente' && (
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={async () => {
                    await updateOrderStatus(item.id, 'en preparación');
                  }}
                >
                  <Text style={styles.orderButtonText}>Empezar preparación</Text>
                </TouchableOpacity>
              )}
              {item.status === 'en preparación' && (
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={async () => {
                    await updateOrderStatus(item.id, 'listo');
                    Alert.alert(`Orden ${item.id} marcada como lista`, "El mesero ha sido notificado.");
                  }}
                >
                  <Text style={styles.orderButtonText}>Marcar como Hecho</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
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
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#347FC2',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 30,
  },
  orderCard: {
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: '90%',
    alignSelf: 'center',
  },
  orderText: {
    fontSize: 16,
    marginBottom: 5,
  },
  itemsTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 10,
  },
  itemText: {
    fontSize: 14,
    marginBottom: 5,
  },
  timeText: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  orderButton: {
    backgroundColor: '#347FC2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  logoutButton: {
    backgroundColor: '#DD1616',
    borderRadius: 5,
    marginTop: 15,
    marginBottom: 15,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
