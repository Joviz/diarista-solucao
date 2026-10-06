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
    let unsubscribeAuth: (() => void) | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      logAuthStep('INIT_FIREBASE_START');
      initFirebase();
      logAuthStep('INIT_FIREBASE_DONE');
    } catch (err) {
      logAuthStep('INIT_AUTH_CATCH_ERROR', {
        error: err instanceof Error ? err.message : String(err),
      });
      setError('Erro ao inicializar Firebase. Verifique a configuração.');
      console.error(err);
      setLoading(false);
      return;
    }

    // IMPORTANT: the auth listener and the safety timeout are registered BEFORE (and
    // independently of) getRedirectResult(). getRedirectResult() loads a cross-site iframe
    // from the Firebase authDomain; on iOS Safari (ITP / content blockers / flaky mobile
    // networks) that iframe may never answer, and awaiting it first left `loading` stuck at
    // `true` forever -> blank screen with no login button.
    try {
      logAuthStep('ON_AUTH_STATE_CHANGED_REGISTER');
      unsubscribeAuth = onAuthStateChangedListener((firebaseUser) => {
        if (cancelled) return;

        logAuthStep('ON_AUTH_STATE_CHANGED_FIRE', {
          hasFirebaseUser: !!firebaseUser,
          authInitialized,
        });

        if (!authInitialized) {
          logAuthStep('AUTH_INITIALIZED_FIRST', { hasFirebaseUser: !!firebaseUser });
          authInitialized = true;
          setUser(firebaseUser);
          setLoading(false);
        } else {
          logAuthStep('AUTH_STATE_CHANGE_SUBSEQUENT', { hasFirebaseUser: !!firebaseUser });
          setUser(firebaseUser);
        }
      });
    } catch (err) {
      logAuthStep('ON_AUTH_STATE_CHANGED_ERROR', {
        error: err instanceof Error ? err.message : String(err),
      });
      setError('Não foi possível verificar sua sessão. Tente entrar novamente.');
      setLoading(false);
    }

    // Safety net: if Firebase never reports the initial auth state, stop loading and let the
    // user see the login screen with an explanation instead of an endless blank/spinner page.
    timeoutId = setTimeout(() => {
      if (!cancelled && !authInitialized) {
        logAuthStep('AUTH_INIT_TIMEOUT');
        setError(
          'Não foi possível verificar sua sessão. Verifique sua conexão e tente entrar novamente.'
        );
        setLoading(false);
      }
    }, 10000);

    // Process a pending signInWithRedirect result in the background. On success, the
    // onAuthStateChanged listener above receives the user; here we only surface errors.
    logAuthStep('HANDLE_REDIRECT_START');
    handleRedirectResult()
      .then(() => logAuthStep('HANDLE_REDIRECT_DONE'))
      .catch((redirectErr) => {
        const errorCode = (redirectErr as { code?: string })?.code;
        logAuthStep('HANDLE_REDIRECT_ERROR', { errorCode });
        if (cancelled) return;
        if (errorCode === 'auth/unauthorized-domain') {
          setError(
            'Este domínio não está autorizado no Firebase. Configure no console do Firebase.'
          );
        } else if (errorCode === 'auth/network-request-failed') {
          setError('Erro de rede. Verifique sua conexão e tente novamente.');
        } else if (errorCode) {
          setError('Não foi possível concluir o login com Google. Tente novamente.');
        }
      });

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribeAuth?.();
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
      console.error('Login error:', errorCode ?? 'unknown');
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
