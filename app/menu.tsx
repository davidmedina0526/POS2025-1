import React, { useState } from 'react';
import { useMenu } from '../context/MenuContext';
import { MenuItem } from '../interfaces/MenuItem';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../utils/supabaseClient'; // Importa el cliente de Supabase

const AddDishForm = () => {
  const { addMenuItem } = useMenu();
  const [newDish, setNewDish] = useState<Omit<MenuItem, 'id'>>({
    name: '',
    description: '',
    price: 0,
    category: 'entrada',
    imageUrl: ''  // Permitir null aquí
  });
  const [showImageOptions, setShowImageOptions] = useState(false);

  // Función para subir la imagen a Supabase y obtener la URL
  const uploadImage = async (uri: string) => {
    const fileExt = uri.split('.').pop(); // Obtén la extensión del archivo
    const fileName = `${new Date().getTime()}.${fileExt}`;

    // Convertir el URI a un objeto Blob
    const response = await fetch(uri);
    const blob = await response.blob(); // Convierte el URI a un Blob

    // Subir el Blob a Supabase
    const { data, error } = await supabase.storage
      .from('menu-images')  // Nombre del bucket en Supabase
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error al subir la imagen:', error);
      return null;
    }

    // Obtener la URL pública de la imagen
    const { data: publicUrlData, error: urlError } = supabase.storage
      .from('menu-images')
      .getPublicUrl(data.path);

    if (urlError) {
      console.error('Error al obtener la URL de la imagen:', urlError);
      return null;
    }

    // Retornar la URL pública
    return publicUrlData.publicUrl;
  };

  // Función para manejar la selección de imagen
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
          const imageUrl = await uploadImage(result.assets[0].uri);
          setNewDish({ ...newDish, imageUrl });
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
          const imageUrl = await uploadImage(result.assets[0].uri);
          setNewDish({ ...newDish, imageUrl });
        }
      }
    }
    setShowImageOptions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Asegúrate de no guardar null en Firestore
    await addMenuItem({
      name: newDish.name,
      description: newDish.description,
      price: newDish.price,
      category: newDish.category,
      imageUrl: newDish.imageUrl || undefined // Aquí tratamos null como undefined
    });
    setNewDish({ name: '', description: '', price: 0, category: 'entrada', imageUrl: null });
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
      <button type="button" onClick={() => setShowImageOptions(!showImageOptions)}>
        {newDish.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
      </button>
      
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

export default AddDishForm;
