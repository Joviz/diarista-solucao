import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

const firebaseMocks = vi.hoisted(() => ({
  initFirebase: vi.fn(),
  isFirebaseConfigured: vi.fn(() => true),
  handleRedirectResult: vi.fn(),
  onAuthStateChangedListener: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
}));

vi.mock('@/lib/firebase', () => firebaseMocks);

import { AuthProvider, useAuth } from './AuthContext';

function Probe() {
  const { loading, user, error } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? 'yes' : 'no'}</span>
      <span data-testid="error">{error ?? ''}</span>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.values(firebaseMocks).forEach((m) => m.mockReset());
    firebaseMocks.isFirebaseConfigured.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('não depende de getRedirectResult para terminar o loading (iOS: iframe travado)', async () => {
    // getRedirectResult never settles, like when the Google auth iframe stalls on iOS Safari.
    firebaseMocks.handleRedirectResult.mockReturnValue(new Promise(() => {}));
    let emit: (u: User | null) => void = () => {};
    firebaseMocks.onAuthStateChangedListener.mockImplementation((cb) => {
      emit = cb;
      return () => {};
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(firebaseMocks.onAuthStateChangedListener).toHaveBeenCalled();
    act(() => emit(null));
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('encerra o loading com mensagem quando o Firebase nunca informa o estado inicial', async () => {
    firebaseMocks.handleRedirectResult.mockReturnValue(new Promise(() => {}));
    firebaseMocks.onAuthStateChangedListener.mockReturnValue(() => {});

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(screen.getByTestId('loading').textContent).toBe('true');

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toMatch(
      /não foi possível verificar sua sessão/i
    );
  });

  it('mostra mensagem compreensível quando getRedirectResult falha', async () => {
    firebaseMocks.handleRedirectResult.mockRejectedValue({ code: 'auth/network-request-failed' });
    firebaseMocks.onAuthStateChangedListener.mockImplementation((cb) => {
      cb(null);
      return () => {};
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await act(async () => {});
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toMatch(/erro de rede/i);
  });

  it('mostra erro e encerra loading quando initFirebase lança exceção', () => {
    firebaseMocks.initFirebase.mockImplementation(() => {
      throw new Error('boom');
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toMatch(/erro ao inicializar firebase/i);
  });
});
