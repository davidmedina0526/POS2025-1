// index.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

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
      <View style={styles.formContainer}>
        <Image 
          source={require('../assets/images/usuario.png')}
          style={{ width: 30, height: 30, alignSelf: 'center', marginRight: 10 }}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6B6B6B"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      <View style={styles.formContainer}>
        <Image
          source={require('../assets/images/candado.png')}
          style={{ width: 30, height: 30, alignSelf: 'center', marginRight: 10 }}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6B6B6B"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Image 
          source={require('../assets/images/entrar.png')}
          style={{ width: 25, height: 25, marginRight: 10 }}
        />
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>
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
  formContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'row',
  },
  title: {
    color: '#347FC2',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: '7%',
  },
  input: {
    textAlign: 'center',
    backgroundColor: '#D8D8D8',
    color: '#000',
    width: '77%',
    height: 50,
    borderColor: '#CCC',
    borderWidth: 1,
    marginBottom: 15,
    padding: 10,
    borderRadius: 12,
  },
  loginButton: {
    backgroundColor: '#347FC2', 
    padding: 15, 
    borderRadius: 10, 
    width: '40%', 
    alignItems: 'center',
    justifyContent: 'center', 
    marginTop: '3%',
    marginBottom: '3%',
    display: 'flex',
    flexDirection: 'row',
  },
  loginButtonText: {
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  linkText: {
    color: '#347FC2',
    fontSize: 15,
    marginTop: 10,
  },
});