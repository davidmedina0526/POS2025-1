import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import CustomButton from './CustomButton';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error('Error en el login:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && user && user.role) {
      switch (user.role) {
        case 'mesero':
          router.push('../app/mesero');
          break;
        case 'caja':
          router.push('../app/caja');
          break;
        case 'cocina':
          router.push('../app/cocinero');
          break;
        case 'admin':
          router.push('../app/admin');
          break;
        default:
          router.push('../app/index');
          break;
      }
    }
  }, [user, loading, router]); // Asegura que la redirección solo ocurra cuando no esté cargando

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
      <CustomButton onPress={handleLogin} title="Log in" />
      <Text style={styles.linkText}>¿Necesitas crear una cuenta? Regístrate!</Text>
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