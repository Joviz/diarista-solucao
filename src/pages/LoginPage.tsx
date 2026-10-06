import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';

function logLoginStep(step: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const host = typeof window !== 'undefined' ? window.location.host : 'ssr';
  const path = typeof window !== 'undefined' ? window.location.pathname : 'ssr';
  console.log(`[LOGIN:${step}] ${timestamp} host=${host} path=${path}`, data ?? '');
}

export function LoginPage() {
  const { login, loading, error, user } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    logLoginStep('EFFECT_USER_CHECK', { user: !!user, loading });
    if (user) {
      logLoginStep('REDIRECT_TO_HOME', { user: !!user });
      window.location.href = '/';
    }
  }, [user]);

  const handleLogin = async () => {
    logLoginStep('HANDLE_LOGIN_CLICKED', { loginLoading, loading });
    setLoginLoading(true);
    try {
      await login();
      logLoginStep('LOGIN_COMPLETED');
    } catch (err) {
      logLoginStep('LOGIN_CATCH_ERROR', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoginLoading(false);
    }
  };

  logLoginStep('RENDER', { user: !!user, loading, error: !!error });

  if (user) {
    logLoginStep('RENDER_USER_EXISTS_RETURN_NULL');
    return null;
  }

  if (!isFirebaseConfigured()) {
    logLoginStep('RENDER_FIREBASE_NOT_CONFIGURED');
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Agenda da Diarista</CardTitle>
            <p className="text-muted-foreground mt-2">Configure o Firebase para continuar</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription className="text-center">
                Firebase não configurado. Crie um arquivo <code>.env</code> com as variáveis:
                <br />
                VITE_FIREBASE_API_KEY
                <br />
                VITE_FIREBASE_AUTH_DOMAIN
                <br />
                VITE_FIREBASE_PROJECT_ID
                <br />
                VITE_FIREBASE_STORAGE_BUCKET
                <br />
                VITE_FIREBASE_MESSAGING_SENDER_ID
                <br />
                VITE_FIREBASE_APP_ID
              </AlertDescription>
            </Alert>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                1. Acesse{' '}
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Firebase Console
                </a>
              </p>
              <p>2. Crie um projeto ou selecione existente</p>
              <p>3. Authentication → Sign-in method → Ative Google</p>
              <p>4. Project Settings → General → Web app → Copie as configurações</p>
              <p>
                5. Crie <code>.env</code> na raiz do projeto com as variáveis acima
              </p>
              <p>
                6. Reinicie o servidor: <code>npm run dev</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Agenda da Diarista</CardTitle>
          <p className="text-muted-foreground mt-2">
            Organize seus atendimentos e acompanhe seus recebimentos
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-center">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              disabled={loading || loginLoading}
              className="w-full gap-2 py-3 text-base"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loginLoading ? 'Entrando...' : 'Entrar com Google'}
            </Button>

            {loading && (
              <p className="text-center text-sm text-muted-foreground">
                Carregando autenticação...
              </p>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Seus dados ficam salvos na nuvem e sincronizados entre dispositivos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
