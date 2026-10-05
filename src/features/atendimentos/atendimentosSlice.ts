import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Atendimento, AtendimentoFormData, SituacaoAtendimento } from './types';
import { atendimentoFormSchema } from './schemas';

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

const initialState: { items: Atendimento[]; initialized: boolean } = {
  items: [],
  initialized: false,
};

export const atendimentosSlice = createSlice({
  name: 'atendimentos',
  initialState,
  reducers: {
    setAtendimentos(state, action: PayloadAction<Atendimento[]>) {
      state.items = action.payload;
      state.initialized = true;
    },
    addAtendimento(state, action: PayloadAction<AtendimentoFormData>) {
      const parsed = atendimentoFormSchema.parse(action.payload);
      const atendimento = formToAtendimento(parsed);
      state.items.push(atendimento);
    },
    updateAtendimento(state, action: PayloadAction<{ id: string; data: AtendimentoFormData }>) {
      const { id, data } = action.payload;
      const parsed = atendimentoFormSchema.parse(data);
      const index = state.items.findIndex((a) => a.id === id);
      if (index !== -1) {
        const updated = formToAtendimento(parsed, id);
        updated.createdAt = state.items[index].createdAt;
        state.items[index] = updated;
      }
    },
    deleteAtendimento(state, action: PayloadAction<string>) {
      state.items = state.items.filter((a) => a.id !== action.payload);
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
      }
    },
    reorderAtendimentos(state, action: PayloadAction<Atendimento[]>) {
      state.items = action.payload;
    },
  },
});

export const {
  setAtendimentos,
  addAtendimento,
  updateAtendimento,
  deleteAtendimento,
  updateSituacao,
  registrarPagamento,
  reorderAtendimentos,
} = atendimentosSlice.actions;

export default atendimentosSlice.reducer;
