import React, { createContext, useContext, useState, ReactNode } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
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

  const addMenuItem = async (menuItem: Omit<MenuItem, 'id'>) => {
    try {
      await addDoc(collection(db, 'menuItems'), menuItem);
      await getMenuItems(); // Actualiza la lista después de agregar un plato
    } catch (error) {
      console.error('Error al agregar el plato: ', error);
    }
  };

  const updateMenuItem = async (id: string, updatedData: Partial<Omit<MenuItem, 'id'>>) => {
    try {
      const docRef = doc(db, 'menuItems', id);
      await updateDoc(docRef, updatedData);
      await getMenuItems(); // Refresca la lista después de actualizar el plato
    } catch (error) {
      console.error('Error al actualizar el plato: ', error);
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const docRef = doc(db, 'menuItems', id);
      await deleteDoc(docRef);
      await getMenuItems(); // Refresca la lista después de eliminar un plato
    } catch (error) {
      console.error('Error al eliminar el plato: ', error);
    }
  };

  return (
    <MenuContext.Provider value={{ menuItems, getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu debe ser usado dentro de un MenuProvider');
  }
  return context;
};
