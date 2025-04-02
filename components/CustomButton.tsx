// /components/CustomButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  style?: ViewStyle;
}

export default function CustomButton({ onPress, title, style }: ButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});