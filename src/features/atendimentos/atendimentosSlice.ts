import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Atendimento, AtendimentoFormData, SituacaoAtendimento } from './types';
import { atendimentoFormSchema } from './schemas';

const STORAGE_KEY = 'diarista-atendimentos';

interface StoredAtendimento {
  id: string;
  cliente: string;
  endereco: string;
  data: string;
  horario: string;
  duracao?: string;
  valorCombinado: number | string;
  situacao: SituacaoAtendimento;
  observacao?: string;
  dataRecebimento?: string;
  valorRecebido?: number | string;
  createdAt: string;
  updatedAt: string;
}

function loadFromStorage(): Atendimento[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredAtendimento[];
      return parsed.map((a) => ({
        ...a,
        valorCombinado: Number(a.valorCombinado),
        valorRecebido: a.valorRecebido ? Number(a.valorRecebido) : undefined,
      }));
    }
  } catch {
    // ignora erro de parse
  }
  return [];
}

function saveToStorage(atendimentos: Atendimento[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atendimentos));
  } catch {
    // ignora erro de quota
  }
}

function generateId(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

function formToAtendimento(form: AtendimentoFormData, id?: string): Atendimento {
  const valorCombinado = Math.round(parseFloat(form.valorCombinado.replace(',', '.')) * 100);
  const valorRecebido = form.valorRecebido
    ? Math.round(parseFloat(form.valorRecebido.replace(',', '.')) * 100)
    : undefined;

  return {
    id: id || generateId(),
    cliente: form.cliente.trim(),
    endereco: form.endereco.trim(),
    data: form.data,
    horario: form.horario,
    duracao: form.duracao?.trim() || undefined,
    valorCombinado,
    situacao: form.situacao,
    observacao: form.observacao?.trim() || undefined,
    dataRecebimento: form.dataRecebimento || undefined,
    valorRecebido,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
}

const demoAtendimentos: Atendimento[] = [
  {
    id: 'demo-1',
    cliente: 'Maria Silva',
    endereco: 'Rua das Flores, 123 - Centro',
    data: '2026-10-07',
    horario: '08:00',
    duracao: '4h',
    valorCombinado: 20000,
    situacao: 'previsto',
    observacao: 'Limpeza geral + janelas',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'demo-2',
    cliente: 'Casa dos Santos',
    endereco: 'Av. Principal, 456 - Jardim',
    data: '2026-10-08',
    horario: '09:00',
    duracao: '3h',
    valorCombinado: 15000,
    situacao: 'realizado',
    observacao: 'Diarista semanal',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'demo-3',
    cliente: 'João Pereira',
    endereco: 'Rua do Comércio, 789 - Vila Nova',
    data: '2026-10-09',
    horario: '13:00',
    duracao: '5h',
    valorCombinado: 25000,
    situacao: 'pago',
    dataRecebimento: '2026-10-09',
    valorRecebido: 25000,
    observacao: 'Faxina pesada pós-obra',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'demo-4',
    cliente: 'Ana Costa',
    endereco: 'Rua das Palmeiras, 321 - Bairro Alto',
    data: '2026-10-10',
    horario: '08:00',
    duracao: '4h',
    valorCombinado: 18000,
    situacao: 'cancelado',
    observacao: 'Cliente cancelou na véspera',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'demo-5',
    cliente: 'Família Oliveira',
    endereco: 'Rua das Acácias, 555 - Centro',
    data: '2026-10-14',
    horario: '08:00',
    duracao: '4h',
    valorCombinado: 20000,
    situacao: 'previsto',
    observacao: 'Limpeza quinzenal',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
];

const initialState: { items: Atendimento[]; initialized: boolean } = {
  items: [],
  initialized: false,
};

export const atendimentosSlice = createSlice({
  name: 'atendimentos',
  initialState,
  reducers: {
    initialize(state) {
      if (!state.initialized) {
        const stored = loadFromStorage();
        state.items = stored.length > 0 ? stored : demoAtendimentos;
        if (stored.length === 0) {
          saveToStorage(demoAtendimentos);
        }
        state.initialized = true;
      }
    },
    addAtendimento(state, action: PayloadAction<AtendimentoFormData>) {
      const parsed = atendimentoFormSchema.parse(action.payload);
      const atendimento = formToAtendimento(parsed);
      state.items.push(atendimento);
      saveToStorage(state.items);
    },
    updateAtendimento(state, action: PayloadAction<{ id: string; data: AtendimentoFormData }>) {
      const { id, data } = action.payload;
      const parsed = atendimentoFormSchema.parse(data);
      const index = state.items.findIndex((a) => a.id === id);
      if (index !== -1) {
        const updated = formToAtendimento(parsed, id);
        updated.createdAt = state.items[index].createdAt;
        state.items[index] = updated;
        saveToStorage(state.items);
      }
    },
    deleteAtendimento(state, action: PayloadAction<string>) {
      state.items = state.items.filter((a) => a.id !== action.payload);
      saveToStorage(state.items);
    },
    updateSituacao(state, action: PayloadAction<{ id: string; situacao: SituacaoAtendimento }>) {
      const { id, situacao } = action.payload;
      const atendimento = state.items.find((a) => a.id === id);
      if (atendimento) {
        atendimento.situacao = situacao;
        atendimento.updatedAt = nowISO();
        if (situacao === 'cancelado') {
          atendimento.valorRecebido = undefined;
          atendimento.dataRecebimento = undefined;
        }
        saveToStorage(state.items);
      }
    },
    registrarPagamento(
      state,
      action: PayloadAction<{ id: string; valorRecebido: number; dataRecebimento: string }>
    ) {
      const { id, valorRecebido, dataRecebimento } = action.payload;
      const atendimento = state.items.find((a) => a.id === id);
      if (atendimento) {
        atendimento.situacao = 'pago';
        atendimento.valorRecebido = valorRecebido;
        atendimento.dataRecebimento = dataRecebimento;
        atendimento.updatedAt = nowISO();
        saveToStorage(state.items);
      }
    },
    reorderAtendimentos(state, action: PayloadAction<Atendimento[]>) {
      state.items = action.payload;
      saveToStorage(state.items);
    },
  },
});

export const {
  initialize,
  addAtendimento,
  updateAtendimento,
  deleteAtendimento,
  updateSituacao,
  registrarPagamento,
  reorderAtendimentos,
} = atendimentosSlice.actions;

export default atendimentosSlice.reducer;
