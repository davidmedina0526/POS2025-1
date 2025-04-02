import React, { useState } from 'react';
import { useMenu } from '../context/MenuContext';
import { MenuItem } from '../interfaces/MenuItem';
import * as ImagePicker from 'expo-image-picker';
import CustomButton from '../components/CustomButton';
import { StyleSheet } from 'react-native';

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

  // Función para solicitar permisos y lanzar la cámara o la galería
  const handlePickImage = async (fromCamera: boolean) => {
    let permissionResult;
    if (fromCamera) {
      // Solicitar permisos para la cámara
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
      if (!result.canceled) {
        if (result.assets && result.assets.length > 0) {
          setNewDish({ ...newDish, imageUrl: result.assets[0].uri });
        }
      }
    } else {
      // Solicitar permisos para la galería
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
      if (!result.canceled) {
        if (result.assets && result.assets.length > 0) {
          setNewDish({ ...newDish, imageUrl: result.assets[0].uri });
        }
      }
    }
    setShowImageOptions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <form onSubmit={handleSubmit}>
      <h3>Agregar Nuevo Plato</h3>
      <input 
        type="text" 
        placeholder="Nombre del plato" 
        value={newDish.name} 
        onChange={e => setNewDish({ ...newDish, name: e.target.value })} 
        required 
      />
      <input 
        type="text" 
        placeholder="Descripción" 
        value={newDish.description} 
        onChange={e => setNewDish({ ...newDish, description: e.target.value })} 
        required 
      />
      <input 
        type="number" 
        placeholder="Precio" 
        value={newDish.price} 
        onChange={e => setNewDish({ ...newDish, price: Number(e.target.value) })} 
        required 
      />
      <select 
        value={newDish.category} 
        onChange={e => setNewDish({ ...newDish, category: e.target.value as 'entrada' | 'plato principal' | 'postre' | 'bebida' })} 
        required
      >
        <option value="entrada">Entrada</option>
        <option value="plato principal">Plato Principal</option>
        <option value="postre">Postre</option>
        <option value="bebida">Bebida</option>
      </select>
      
      {/* Botón para seleccionar imagen */}
      <CustomButton type="button" onClick={() => setShowImageOptions(!showImageOptions)}>
        {newDish.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
      </CustomButton>
      
      {/* Menú de opciones para subir imagen */}
      {showImageOptions && (
        <div>
          <button type="button" onClick={() => handlePickImage(true)}>
            Tomar foto
          </button>
          <button type="button" onClick={() => handlePickImage(false)}>
            Elegir de archivos
          </button>
        </div>
      )}
      
      {/* Vista previa de la imagen si existe */}
      {newDish.imageUrl && (
        <div>
          <img src={newDish.imageUrl} alt="Vista previa" style={{ width: '200px', height: 'auto' }} />
        </div>
      )}
      
      <button type="submit">Agregar Plato</button>
    </form>
  );
};

const styles = StyleSheet.create({
  
});

export default AddDishForm;
