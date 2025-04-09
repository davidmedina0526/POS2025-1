import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React from 'react';
import { useState } from 'react';
import { Button, Text, View, StyleSheet } from 'react-native';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [qr, setQr] = useState('');
  const [scanned, setScanned] = useState(false);

  const handleQrScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setQr(data);
      setScanned(true);
      console.log('QR Scanned:', data);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={handleQrScanned}
      />

      {qr ? (
        <View style={styles.qrInfo}>
          <Text style={styles.qrText}>Estas sentado en la mesa: {qr}</Text>
          <Button
            title="Scan Again"
            onPress={() => {
              setQr('');
              setScanned(false);
            }}
          />
          <Button
            title="Go to Menu"
            onPress={() => {
              router.push({
                pathname: '/cliente',
                params: { qr },
              });
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBB03B',
    padding: 20,
  },
  text: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
  },
  camera: {
    width: '50%',
    height: '50%',
    borderRadius: 20, 
    position: 'absolute',
  },
  qrInfo: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  qrText: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
})