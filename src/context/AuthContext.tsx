import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithGoogle,
  signOutUser,
  onAuthStateChangedListener,
  initFirebase,
  isFirebaseConfigured,
} from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  firebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);

  useEffect(() => {
    const configured = isFirebaseConfigured();
    setFirebaseConfigured(configured);

    if (!configured) {
      setLoading(false);
      return;
    }

    try {
      initFirebase();
      const unsubscribe = onAuthStateChangedListener((firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      setError('Erro ao inicializar Firebase. Verifique a configuração.');
      console.error(err);
      setLoading(false);
    }
  }, []);

  const login = async () => {
    if (!firebaseConfigured) {
      setError('Firebase não configurado. Configure as variáveis de ambiente.');
      return;
    }
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Erro ao fazer login com Google. Tente novamente.');
      console.error(err);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOutUser();
    } catch (err) {
      setError('Erro ao sair. Tente novamente.');
      console.error(err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, clearError, firebaseConfigured }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
