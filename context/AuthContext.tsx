import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../utils/FireBaseConfig'; // Importamos la configuración de Firebase
import { collection, addDoc } from 'firebase/firestore';

// Definir los tipos de datos para el contexto
interface AuthContextType {
  user: any; // Puedes ser más específico aquí dependiendo de lo que manejes de usuario
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: 'caja' | 'mesero') => Promise<void>;
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
      setUser(userCredential.user);
    } catch (error) {
      console.error('Error de login:', error);
      throw new Error('Error de login');
    }
  };

  // Función de register
  const register = async (email: string, password: string, role: 'caja' | 'mesero') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);

      // Guardar el usuario en Firestore
      await addDoc(collection(db, 'users'), {
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
