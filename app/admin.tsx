// app/admin.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';

export default function AdminScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!user || user.role !== 'admin')) {
      router.replace('./index');
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
      <Text style={styles.title}>Pantalla de Admin</Text>
      <CustomButton onPress={() => router.push('/menu')} title="Menú" />
      <CustomButton onPress={() => router.push('/personal')} title="Personal" />
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