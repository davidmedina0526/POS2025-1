// QRScannerScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useRouter } from 'expo-router';
import { useWaiterContext } from '../context/WaiterContext';

export default function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const { selectTable } = useWaiterContext();

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    // Suponemos que el código QR contiene el ID de la mesa con el formato "table_X"
    if (data.startsWith('table_')) {
      // Se asigna la mesa escaneada a la sesión/usuario
      selectTable(data);
      // Redirige a la pantalla de mesero y abre el modal del menú pasando el parámetro openMenu
      router.replace({ pathname: '/mesero', params: { openMenu: 'true' } });
    } else {
      Alert.alert('QR inválido', 'El código QR escaneado no es válido para una mesa.');
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text>Solicitando permiso para usar la cámara...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text>Sin acceso a la cámara</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
          <Text style={styles.buttonText}>Escanear de nuevo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#347FC2',
    padding: 10,
    borderRadius: 5,
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});