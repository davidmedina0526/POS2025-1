import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useCookContext } from '../context/CocinaContext'; // Usamos el hook
import { Order } from '../interfaces/Order';

export default function CookScreen() {
  const { orders, updateOrderStatus, calculateTimeSinceOrder } = useCookContext(); // Usamos el hook
  const [time, setTime] = useState<{ [key: string]: number }>({});

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
      <Text style={styles.title}>Órdenes en Cocina</Text>

      {/* Lista de órdenes en cocina */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          // Obtener el tiempo de la orden
          const timeInSeconds = time[item.id] || calculateTimeSinceOrder(item.createdAt);
          const isRed = timeInSeconds > 30; // Si pasa de 30 segundos, ponemos el tiempo en rojo

          return (
            <View style={styles.orderCard}>
              <Text style={styles.orderText}>Orden ID: {item.id}</Text>
              <Text style={styles.orderText}>Estado: {item.status}</Text>
              
              {/* Mostrar los ítems de la orden */}
              <Text style={styles.itemsTitle}>Platos:</Text>
              {item.items.map((orderItem, index) => (
                <Text key={index} style={styles.itemText}>
                  {orderItem.quantity}x {orderItem.name}
                </Text>
              ))}

              {/* Mostrar el tiempo transcurrido en segundos */}
              <Text
                style={[
                  styles.timeText,
                  { color: isRed ? 'red' : 'black' }, // Poner en rojo si pasa de 30 segundos
                ]}
              >
                Tiempo en cocina: {timeInSeconds} seg
              </Text>

              {/* Botón para cambiar el estado de la orden */}
              {item.status === 'pendiente' && (
                <Button
                  title="Empezar preparación"
                  onPress={() => updateOrderStatus(item.id, 'en preparación')}
                />
              )}
              {item.status === 'en preparación' && (
                <Button
                  title="Marcar como Hecho"
                  onPress={() => updateOrderStatus(item.id, 'listo')}
                />
              )}
            </View>
          );
        }}
      />
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
    marginBottom: 20,
  },
  orderCard: {
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: '90%',
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
  },
});
