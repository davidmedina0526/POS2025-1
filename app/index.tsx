// index.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import CustomButton from '../components/CustomButton';  // Asegúrate de la ruta correcta

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const loggedUser = await login(email, password);
      if (loggedUser?.role) {
        switch (loggedUser.role) {
          case 'mesero':
            router.push('/mesero');
            break;
          case 'caja':
            router.push('/caja');
            break;
          case 'cocina':
            router.push('/cocinero');
            break;
          case 'admin':
            router.push('/admin');
            break;
          default:
            console.log('No se ha encontrado un rol para el usuario.');
            break;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RestPOS</Text>
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
      {/* Uso del CustomButton */}
      <CustomButton onPress={handleLogin} title="Log in" />
      <Text style={styles.linkText}>Need a new account? Sign Up!</Text>
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
    marginBottom: '6%',
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
  linkText: {
    color: '#347FC2',
    fontSize: 15,
  },
});