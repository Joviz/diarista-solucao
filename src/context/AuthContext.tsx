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
  firebaseConfigured: boolean;
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
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const configured = isFirebaseConfigured();
    logAuthStep('CONFIG_CHECK', { configured });
    setFirebaseConfigured(configured);

    if (!configured) {
      logAuthStep('CONFIG_NOT_CONFIGURED', { loading: false });
      setLoading(false);
      return;
    }

    let authInitialized = false;

    const initializeAuth = async () => {
      try {
        logAuthStep('INIT_FIREBASE_START');
        initFirebase();
        logAuthStep('INIT_FIREBASE_DONE');

        // Process redirect result first
        let redirectUser: User | null = null;
        try {
          logAuthStep('HANDLE_REDIRECT_START');
          redirectUser = await handleRedirectResult();
          logAuthStep('HANDLE_REDIRECT_DONE', {
            hasUser: !!redirectUser,
            uid: redirectUser?.uid ?? null,
          });
        } catch (redirectErr) {
          logAuthStep('HANDLE_REDIRECT_ERROR', {
            error: redirectErr instanceof Error ? redirectErr.message : String(redirectErr),
            errorCode: (redirectErr as { code?: string })?.code,
          });
        }

        // Set up auth state listener
        logAuthStep('ON_AUTH_STATE_CHANGED_REGISTER');
        const unsubscribe = onAuthStateChangedListener((firebaseUser) => {
          if (cancelled) return;

          logAuthStep('ON_AUTH_STATE_CHANGED_FIRE', {
            hasFirebaseUser: !!firebaseUser,
            uid: firebaseUser?.uid ?? null,
            authInitialized,
          });

          if (cancelled) return;

          const userToSet = redirectUser ?? firebaseUser;

          if (!authInitialized) {
            logAuthStep('AUTH_INITIALIZED_FIRST', {
              hasRedirectUser: !!redirectUser,
              hasFirebaseUser: !!firebaseUser,
              userToSet: userToSet ? 'user' : 'null',
            });
            authInitialized = true;
            setUser(userToSet);
            setLoading(false);
          } else {
            logAuthStep('AUTH_STATE_CHANGE_SUBSEQUENT', {
              hasFirebaseUser: !!firebaseUser,
            });
            setUser(firebaseUser);
          }
        });

        // If we got a redirect user, set it immediately
        if (redirectUser && !cancelled) {
          logAuthStep('SET_REDIRECT_USER_IMMEDIATE', {
            uid: redirectUser.uid,
            authInitialized,
          });
          if (!authInitialized) {
            authInitialized = true;
            setUser(redirectUser);
            setLoading(false);
          }
        }

        return () => {
          cancelled = true;
          unsubscribe();
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
    if (!firebaseConfigured) {
      setError('Firebase não configurado. Configure as variáveis de ambiente.');
      return;
    }
    setError(null);
    try {
      logAuthStep('LOGIN_CLICKED', { firebaseConfigured });
      await signInWithGoogle();
      logAuthStep('SIGN_IN_WITH_REDIRECT_CALLED');
    } catch (err) {
      logAuthStep('LOGIN_ERROR', {
        error: err instanceof Error ? err.message : String(err),
      });
      setError('Erro ao fazer login com Google. Tente novamente.');
      console.error(err);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      logAuthStep('LOGOUT_CLICKED');
      await signOutUser();
      logAuthStep('SIGN_OUT_COMPLETE');
    } catch (err) {
      logAuthStep('LOGOUT_ERROR', {
        error: err instanceof Error ? err.message : String(err),
      });
      setError('Erro ao sair. Tente novamente.');
      console.error(err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, clearError, setError, firebaseConfigured }}
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
