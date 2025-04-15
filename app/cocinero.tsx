import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Image
} from 'react-native';
import { useCookContext } from '../context/CocinaContext'; // Usamos el hook
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

export default function CookScreen() {
  const { user, logout } = useAuth();
  const { orders, updateOrderStatus, calculateTimeSinceOrder } = useCookContext(); // Usamos el hook
  const [ time, setTime ] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    // Actualizar el tiempo cada segundo
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

    return () => clearInterval(intervalId); // Limpiar el intervalo cuando se desmonte el componente
  }, [orders]); // Solo volver a ejecutar si las órdenes cambian

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, cook!</Text>

      {/* Lista de órdenes en cocina */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          // Obtener el tiempo de la orden
          const timeInSeconds = time[item.id] || calculateTimeSinceOrder(item.createdAt);
          const isRed = timeInSeconds > 60; // Pinta en rojo si pasa de 60 segundos

          return (
            <View style={styles.orderCard}>
              <Text style={styles.orderText}>Order ID: {item.id}</Text>
              <Text style={styles.orderText}>Status: {item.status}</Text>
              
              {/* Mostrar los ítems de la orden */}
              <Text style={styles.itemsTitle}>Items:</Text>
              {item.items.map((orderItem, index) => (
                <Text key={index} style={styles.itemText}>
                  {orderItem.quantity}x {orderItem.name}
                </Text>
              ))}

              {/* Mostrar el tiempo transcurrido */}
              <Text
                style={[
                  styles.timeText,
                  { color: isRed ? 'red' : 'black' },
                ]}
              >
                Time in kitchen: {timeInSeconds} seconds
              </Text>

              {/* Botón para cambiar el estado de la orden */}
              {item.status === 'pendiente' && (
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={async () => {
                    await updateOrderStatus(item.id, 'en preparación');
                  }}
                >
                  <Text style={styles.orderButtonText}>Begin Preparing</Text>
                </TouchableOpacity>
              )}
              {item.status === 'en preparación' && (
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={async () => {
                    await updateOrderStatus(item.id, 'listo');
                    Alert.alert(`Order ${item.id} marked as ready!`, "The waiter has been notified."
                    );
                  }}
                >
                  <Text style={styles.orderButtonText}>Mark as Ready</Text>
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
        <Text style={styles.logoutButtonText}>Log Out</Text>
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
    marginBottom: 60,
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
    display: 'flex',
    flexDirection: 'row',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});