// app/menu.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function MenuScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!user || user.role !== 'admin')) {
      router.replace('./index'); // Usamos ruta absoluta
    }
  }, [user, mounted]);

  if (!mounted || !user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#347FC2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menú Admin</Text>
      {/* Aquí agrega el contenido del menú */}
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
    marginBottom: '6%',
  },
});