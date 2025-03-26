import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function Index() {

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TO DO (NOMBRE)</Text>
      <TextInput 
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#AAA"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput 
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#AAA"
        secureTextEntry
      />
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Log in</Text>
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
    backgroundColor: '#FFFFFF'
  },
  title: { 
    color: '#347FC2',
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: '6%',
  },
  input: { 
    textAlign: 'center',
    backgroundColor: '#EBEBEB',
    color: '#AAA',
    width: '80%',
    height: 50, 
    borderColor: '#CCC', 
    borderWidth: 1, 
    marginBottom: 15, 
    padding: 10, 
    borderRadius: 40,
  },
  button: { 
    backgroundColor: '#347FC2', 
    padding: 15, 
    borderRadius: 40, 
    width: '80%', 
    alignItems: 'center', 
    marginTop: '5%',
    marginBottom: '3%' 
  },
  buttonText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  linkText: { 
    color: '#347FC2', 
    fontSize: 15, 
  },
});