import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithGoogle,
  signOutUser,
  handleRedirectResult,
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
    let cancelled = false;

    const configured = isFirebaseConfigured();
    setFirebaseConfigured(configured);

    if (!configured) {
      setLoading(false);
      return;
    }

    let authInitialized = false;

    const initializeAuth = async () => {
      try {
        initFirebase();

        // Process redirect result first
        let redirectUser: User | null = null;
        try {
          redirectUser = await handleRedirectResult();
        } catch (redirectErr) {
          console.error('Erro no redirect:', redirectErr);
        }

        // Set up auth state listener
        const unsubscribe = onAuthStateChangedListener((firebaseUser) => {
          if (cancelled) return;

          // If we got a redirect user, prefer it over the auth state
          // (redirect result is more immediate and reliable for the current session)
          const userToSet = redirectUser ?? firebaseUser;

          if (!authInitialized) {
            authInitialized = true;
            setUser(userToSet);
            setLoading(false);
          } else {
            setUser(firebaseUser);
          }
        });

        // If we got a redirect user, set it immediately
        if (redirectUser && !cancelled) {
          setUser(redirectUser);
          if (!authInitialized) {
            authInitialized = true;
            setLoading(false);
          }
        }

        return () => {
          cancelled = true;
          unsubscribe();
        };
      } catch (err) {
        if (!cancelled) {
          setError('Erro ao inicializar Firebase. Verifique a configuração.');
          console.error(err);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
    };
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
