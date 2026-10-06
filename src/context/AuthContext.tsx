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
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function logAuthStep(step: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const host = typeof window !== 'undefined' ? window.location.host : 'ssr';
  const path = typeof window !== 'undefined' ? window.location.pathname : 'ssr';
  console.log(`[AUTH:${step}] ${timestamp} host=${host} path=${path}`, data ?? '');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let authInitialized = false;

    const initializeAuth = async () => {
      try {
        logAuthStep('INIT_FIREBASE_START');
        initFirebase();
        logAuthStep('INIT_FIREBASE_DONE');

        // Process redirect result first (for signInWithRedirect flow)
        try {
          logAuthStep('HANDLE_REDIRECT_START');
          await handleRedirectResult();
          logAuthStep('HANDLE_REDIRECT_DONE');
        } catch (redirectErr) {
          logAuthStep('HANDLE_REDIRECT_ERROR', {
            error: redirectErr instanceof Error ? redirectErr.message : String(redirectErr),
            errorCode: (redirectErr as { code?: string })?.code,
          });
        }

        // Set up auth state listener
        logAuthStep('ON_AUTH_STATE_CHANGED_REGISTER');
        onAuthStateChangedListener((firebaseUser) => {
          if (cancelled) return;

          logAuthStep('ON_AUTH_STATE_CHANGED_FIRE', {
            hasFirebaseUser: !!firebaseUser,
            uid: firebaseUser?.uid ?? null,
            authInitialized,
          });

          if (cancelled) return;

          if (!authInitialized) {
            logAuthStep('AUTH_INITIALIZED_FIRST', {
              hasFirebaseUser: !!firebaseUser,
            });
            authInitialized = true;
            setUser(firebaseUser);
            setLoading(false);
          } else {
            logAuthStep('AUTH_STATE_CHANGE_SUBSEQUENT', {
              hasFirebaseUser: !!firebaseUser,
            });
            setUser(firebaseUser);
          }
        });

        // Safety timeout: if auth doesn't initialize within 10 seconds, stop loading
        const timeoutId = setTimeout(() => {
          if (!cancelled && !authInitialized) {
            logAuthStep('AUTH_INIT_TIMEOUT', { loading: true });
            setLoading(false);
          }
        }, 10000);

        return () => {
          cancelled = true;
          clearTimeout(timeoutId);
        };
      } catch (err) {
        if (!cancelled) {
          logAuthStep('INIT_AUTH_CATCH_ERROR', {
            error: err instanceof Error ? err.message : String(err),
          });
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
    const configured = isFirebaseConfigured();
    if (!configured) {
      setError('Firebase não configurado. Configure as variáveis de ambiente.');
      return;
    }
    setError(null);
    try {
      logAuthStep('LOGIN_CLICKED');
      await signInWithGoogle();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logAuthStep('LOGIN_ERROR', { error: errorMessage });

      // Check for specific error codes
      const errorCode = (err as { code?: string })?.code;
      if (errorCode === 'auth/popup-blocked') {
        setError(
          'Popup bloqueado pelo navegador. Permita popups para este site e tente novamente.'
        );
      } else if (errorCode === 'auth/cancelled-popup-request') {
        setError('Login cancelado. Tente novamente.');
      } else if (errorCode === 'auth/network-request-failed') {
        setError('Erro de rede. Verifique sua conexão e tente novamente.');
      } else if (errorCode === 'auth/unauthorized-domain') {
        setError('Este domínio não está autorizado no Firebase. Configure no console do Firebase.');
      } else {
        setError('Erro ao fazer login com Google. Tente novamente.');
      }
      console.error('Login error:', err);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOutUser();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logAuthStep('LOGOUT_ERROR', { error: errorMessage });
      setError('Erro ao sair. Tente novamente.');
      console.error(err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, clearError, setError }}>
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
