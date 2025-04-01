import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../utils/FireBaseConfig'; // Importamos la configuración de Firebase
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';

// Definir los tipos de datos para el contexto
interface AuthContextType {
  user: any; // Puedes ser más específico aquí dependiendo de lo que manejes de usuario
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: 'caja' | 'mesero' | 'cocina' | 'admin') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Crear un componente proveedor de autenticación
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null); // Puede cambiarse por el tipo específico que manejes

  const auth = getAuth();

  // Función de login
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuario logueado:', userCredential.user);
  
      // Obtener el documento del usuario en Firestore
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Actualiza el estado con el usuario y su rol
        setUser({ ...userCredential.user, role: userData.role });
      } else {
        throw new Error('No se encontró la información del rol para este usuario.');
      }
    } catch (error) {
      console.error('Error de login:', error);
      throw new Error('Error de login');
    }
  };
  

  // Función de register
  const register = async (email: string, password: string, role: 'caja' | 'mesero' | 'cocina' | 'admin') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);

      // Guardar el usuario en Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        role,
        userId: userCredential.user.uid,
      });
    } catch (error) {
      console.error('Error de registro:', error);
      throw new Error('Error de registro');
    }
  };

  // Función de logout
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para consumir el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
