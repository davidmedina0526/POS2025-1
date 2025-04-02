import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../utils/FireBaseConfig';
import { MenuItem } from '../interfaces/MenuItem';

interface MenuContextType {
  menuItems: MenuItem[];
  getMenuItems: () => Promise<void>;
  addMenuItem: (menuItem: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, updatedData: Partial<Omit<MenuItem, 'id'>>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Función para obtener todos los platos del menú
  const getMenuItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'menuItems'));
      const items: MenuItem[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<MenuItem, 'id'>)
      }));
      setMenuItems(items);
    } catch (error) {
      console.error('Error al obtener los platos del menú: ', error);
    }
  };

  // Función para agregar un plato al menú
  const addMenuItem = async (menuItem: Omit<MenuItem, 'id'>) => {
    try {
      await addDoc(collection(db, 'menuItems'), menuItem);
      await getMenuItems(); // Actualiza la lista
    } catch (error) {
      console.error('Error al agregar el plato: ', error);
    }
  };

  // Función para actualizar un plato del menú
  const updateMenuItem = async (id: string, updatedData: Partial<Omit<MenuItem, 'id'>>) => {
    try {
      const docRef = doc(db, 'menuItems', id);
      await updateDoc(docRef, updatedData);
      await getMenuItems();
    } catch (error) {
      console.error('Error al actualizar el plato: ', error);
    }
  };

  // Función para eliminar un plato del menú
  const deleteMenuItem = async (id: string) => {
    try {
      const docRef = doc(db, 'menuItems', id);
      await deleteDoc(docRef);
      await getMenuItems();
    } catch (error) {
      console.error('Error al eliminar el plato: ', error);
    }
  };

  useEffect(() => {
    getMenuItems();
  }, []);

  return (
    <MenuContext.Provider value={{ menuItems, getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu debe usarse dentro de un MenuProvider');
  }
  return context;
};
