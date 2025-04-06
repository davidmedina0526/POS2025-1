import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useMenu } from '../context/MenuContext';
import { MenuItem } from '../interfaces/MenuItem';
import * as ImagePicker from 'expo-image-picker';
import CustomButton from '../components/CustomButton';
import { supabase } from '../utils/supabaseClient'; // Importa el cliente de Supabase

const AddDishForm = () => {
  const { addMenuItem } = useMenu();
  const [newDish, setNewDish] = useState<Omit<MenuItem, 'id'>>({
    name: '',
    description: '',
    price: 0,
    category: 'entrada',
    imageUrl: ''
  });
  const [showImageOptions, setShowImageOptions] = useState(false);

  const handlePickImage = async (fromCamera: boolean) => {
    let permissionResult;
    if (fromCamera) {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        alert('Permiso de cámara denegado');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewDish({ ...newDish, imageUrl: result.assets[0].uri });
      }
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        alert('Permiso para acceder a la galería denegado');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewDish({ ...newDish, imageUrl: result.assets[0].uri });
      }
    }
    setShowImageOptions(false);
  };

  const handleSubmit = async () => {
    await addMenuItem({
      name: newDish.name,
      description: newDish.description,
      price: newDish.price,
      category: newDish.category,
      imageUrl: newDish.imageUrl || undefined
    });
    setNewDish({ name: '', description: '', price: 0, category: 'entrada', imageUrl: '' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar Nuevo Plato</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nombre del plato"
        value={newDish.name}
        onChangeText={text => setNewDish({ ...newDish, name: text })}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Descripción"
        value={newDish.description}
        onChangeText={text => setNewDish({ ...newDish, description: text })}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Precio"
        value={newDish.price.toString()}
        keyboardType="numeric"
        onChangeText={text => setNewDish({ ...newDish, price: Number(text) })}
      />
      
      <Picker
        selectedValue={newDish.category}
        style={styles.picker}
        onValueChange={(itemValue) =>
          setNewDish({ ...newDish, category: itemValue as 'entrada' | 'plato principal' | 'postre' | 'bebida' })
        }
      >
        <Picker.Item label="Entrada" value="entrada" />
        <Picker.Item label="Plato Principal" value="plato principal" />
        <Picker.Item label="Postre" value="postre" />
        <Picker.Item label="Bebida" value="bebida" />
      </Picker>
      
      <CustomButton 
        title={newDish.imageUrl ? 'Cambiar imagen' : 'Subir imagen'} 
        onPress={() => setShowImageOptions(!showImageOptions)} 
      />
      
      {showImageOptions && (
        <View style={styles.imageOptions}>
          <CustomButton title="Tomar foto" onPress={() => handlePickImage(true)} />
          <CustomButton title="Elegir de archivos" onPress={() => handlePickImage(false)} />
        </View>
      )}
      
      {newDish.imageUrl && (
        <Image source={{ uri: newDish.imageUrl }} style={styles.imagePreview} />
      )}
      
      <CustomButton title="Agregar Plato" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#D8D8D8',
    color: '#000',
    height: 50,
    borderColor: '#CCC',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  picker: {
    backgroundColor: '#D8D8D8',
    marginBottom: 15,
  },
  imageOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  imagePreview: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 15,
  },
});

export default AddDishForm;