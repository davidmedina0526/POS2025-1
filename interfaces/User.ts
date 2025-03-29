export interface User {
    id: string; // ID automatico de firestore
    email: string;
    password: string;
    role: 'admin' | 'caja' | 'mesero' | 'cocina';
  }
  