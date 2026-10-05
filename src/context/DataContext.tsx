import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Atendimento, AtendimentoFormData } from '@/features/atendimentos/types';
import type { AtendimentoFirestore } from '@/lib/firebase';
import {
  loadAtendimentosFromFirebase,
  saveAtendimentosToFirebase,
  subscribeToAtendimentos,
} from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch } from '@/app/hooks';
import {
  setAtendimentos,
  addAtendimento as addAtendimentoAction,
  updateAtendimento as updateAtendimentoAction,
  deleteAtendimento as deleteAtendimentoAction,
  updateSituacao as updateSituacaoAction,
  registrarPagamento as registrarPagamentoAction,
} from '@/features/atendimentos/atendimentosSlice';

interface DataContextType {
  atendimentos: Atendimento[];
  loading: boolean;
  error: string | null;
  addAtendimento: (
    atendimento: Omit<Atendimento, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateAtendimento: (id: string, data: Partial<Atendimento>) => Promise<void>;
  deleteAtendimento: (id: string) => Promise<void>;
  updateSituacao: (id: string, situacao: Atendimento['situacao']) => Promise<void>;
  registrarPagamento: (id: string, valorRecebido: number, dataRecebimento: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function generateId(): string {
  return uuidv4();
}

function nowISO(): string {
  return new Date().toISOString();
}

function toAtendimento(firestore: AtendimentoFirestore): Atendimento {
  return {
    id: firestore.id,
    cliente: firestore.cliente,
    endereco: firestore.endereco,
    data: firestore.data,
    horario: firestore.horario,
    duracao: firestore.duracao,
    valorCombinado: firestore.valorCombinado,
    situacao: firestore.situacao,
    observacao: firestore.observacao,
    dataRecebimento: firestore.dataRecebimento,
    valorRecebido: firestore.valorRecebido,
    createdAt: firestore.createdAt,
    updatedAt: firestore.updatedAt,
  };
}

function toAtendimentoFormData(atendimento: Atendimento): AtendimentoFormData {
  return {
    cliente: atendimento.cliente,
    endereco: atendimento.endereco,
    data: atendimento.data,
    horario: atendimento.horario,
    duracao: atendimento.duracao || '',
    valorCombinado: (atendimento.valorCombinado / 100).toFixed(2).replace('.', ','),
    situacao: atendimento.situacao,
    observacao: atendimento.observacao || '',
    dataRecebimento: atendimento.dataRecebimento || '',
    valorRecebido: atendimento.valorRecebido
      ? (atendimento.valorRecebido / 100).toFixed(2).replace('.', ',')
      : '',
  };
}

function toAtendimentoFirestore(atendimento: Atendimento, userId: string): AtendimentoFirestore {
  const data: Partial<AtendimentoFirestore> = {
    id: atendimento.id,
    cliente: atendimento.cliente,
    endereco: atendimento.endereco,
    data: atendimento.data,
    horario: atendimento.horario,
    valorCombinado: atendimento.valorCombinado,
    situacao: atendimento.situacao,
    createdAt: atendimento.createdAt,
    updatedAt: atendimento.updatedAt,
    userId,
  };

  // Só adiciona campos opcionais se não forem undefined/empty
  if (atendimento.duracao) data.duracao = atendimento.duracao;
  if (atendimento.observacao) data.observacao = atendimento.observacao;
  if (atendimento.dataRecebimento) data.dataRecebimento = atendimento.dataRecebimento;
  if (atendimento.valorRecebido !== undefined && atendimento.valorRecebido !== null)
    data.valorRecebido = atendimento.valorRecebido;

  return data as AtendimentoFirestore;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const dispatch = useAppDispatch();

  const [atendimentos, setAtendimentosState] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setAtendimentosState([]);
      setLoading(false);
      dispatch(setAtendimentos([]));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await loadAtendimentosFromFirebase(user.uid);
      const converted = data.map(toAtendimento);
      setAtendimentosState(converted);
      dispatch(setAtendimentos(converted));
    } catch (err) {
      setError('Erro ao carregar dados. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, dispatch]);

  const setupSubscription = useCallback(() => {
    if (!user) {
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
      return;
    }

    if (unsubscribe) {
      unsubscribe();
    }

    const unsub = subscribeToAtendimentos(user.uid, (data) => {
      const converted = data.map(toAtendimento);
      setAtendimentosState(converted);
      dispatch(setAtendimentos(converted));
      setLoading(false);
    });
    setUnsubscribe(unsub);
  }, [user, unsubscribe, dispatch]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  useEffect(() => {
    if (user) {
      setupSubscription();
    } else if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, setupSubscription, unsubscribe]);

  const saveAll = async (updatedAtendimentos: Atendimento[]) => {
    if (!user) return;
    try {
      setError(null);
      const firestoreData = updatedAtendimentos.map((a) => toAtendimentoFirestore(a, user.uid));
      await saveAtendimentosToFirebase(user.uid, firestoreData);
    } catch (err) {
      setError('Erro ao salvar dados. Tente novamente.');
      console.error(err);
      throw err;
    }
  };

  const addAtendimento = async (
    atendimento: Omit<Atendimento, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newAtendimento: Atendimento = {
      ...atendimento,
      id: generateId(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    dispatch(addAtendimentoAction(toAtendimentoFormData(newAtendimento)));
    await saveAll([...atendimentos, newAtendimento]);
  };

  const updateAtendimento = async (id: string, data: Partial<Atendimento>) => {
    const updated = atendimentos.map((a) =>
      a.id === id ? { ...a, ...data, updatedAt: nowISO() } : a
    );
    const updatedItem = updated.find((a) => a.id === id)!;
    dispatch(updateAtendimentoAction({ id, data: toAtendimentoFormData(updatedItem) }));
    await saveAll(updated);
  };

  const deleteAtendimento = async (id: string) => {
    const updated = atendimentos.filter((a) => a.id !== id);
    dispatch(deleteAtendimentoAction(id));
    await saveAll(updated);
  };

  const updateSituacao = async (id: string, situacao: Atendimento['situacao']) => {
    const updated = atendimentos.map((a) => {
      if (a.id === id) {
        const newAtendimento = { ...a, situacao, updatedAt: nowISO() };
        if (situacao === 'cancelado') {
          newAtendimento.valorRecebido = undefined;
          newAtendimento.dataRecebimento = undefined;
        }
        // Desfazer pagamento: ao voltar de 'pago' para 'realizado', limpar dados de pagamento
        if (a.situacao === 'pago' && situacao === 'realizado') {
          newAtendimento.valorRecebido = undefined;
          newAtendimento.dataRecebimento = undefined;
        }
        return newAtendimento;
      }
      return a;
    });
    dispatch(updateSituacaoAction({ id, situacao }));
    await saveAll(updated);
  };

  const registrarPagamento = async (id: string, valorRecebido: number, dataRecebimento: string) => {
    const updated = atendimentos.map((a) =>
      a.id === id
        ? { ...a, situacao: 'pago' as const, valorRecebido, dataRecebimento, updatedAt: nowISO() }
        : a
    );
    dispatch(registrarPagamentoAction({ id, valorRecebido, dataRecebimento }));
    await saveAll(updated);
  };

  const refreshData = async () => {
    await loadData();
  };

  return (
    <DataContext.Provider
      value={{
        atendimentos,
        loading: loading || authLoading,
        error,
        addAtendimento,
        updateAtendimento,
        deleteAtendimento,
        updateSituacao,
        registrarPagamento,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de DataProvider');
  }
  return context;
}
