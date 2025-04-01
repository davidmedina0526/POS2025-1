// /components/RegisterForm.tsx
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import CustomButton from './CustomButton';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setrole] = useState('mesero');
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    try {
      await register(email, password, role as 'caja' | 'mesero' | 'cocina' | 'admin');
      router.push('../app/index'); // O redirige a la pantalla de login
    } catch (error) {
      console.error('Error en el registro:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput 
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#6B6B6B"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput 
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#6B6B6B"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Picker
        selectedValue={role}
        style={styles.input}
        onValueChange={(itemValue) => setrole(itemValue)}
      >
        <Picker.Item label="Mesero" value="mesero" />
        <Picker.Item label="Caja" value="caja" />
        <Picker.Item label="Cocina" value="cocina" />
        <Picker.Item label="Admin" value="admin" />
      </Picker>
      <CustomButton onPress={handleRegister} title="Register" />
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
  input: { 
    textAlign: 'center',
    backgroundColor: '#D8D8D8',
    color: '#000',
    width: '80%',
    height: 50, 
    borderColor: '#CCC', 
    borderWidth: 1, 
    marginBottom: 15, 
    padding: 10, 
    borderRadius: 12,
  },
});