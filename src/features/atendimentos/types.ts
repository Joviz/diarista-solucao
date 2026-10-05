export type SituacaoAtendimento = 'previsto' | 'realizado' | 'pago' | 'cancelado';

export interface Atendimento {
  id: string;
  cliente: string;
  endereco: string;
  data: string; // ISO date string YYYY-MM-DD
  horario: string; // HH:mm
  duracao?: string; // opcional, ex: "2h", "3h30min"
  valorCombinado: number; // em centavos
  situacao: SituacaoAtendimento;
  observacao?: string;
  dataRecebimento?: string; // ISO date string
  valorRecebido?: number; // em centavos
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface AtendimentoFormData {
  cliente: string;
  endereco: string;
  data: string;
  horario: string;
  duracao: string;
  valorCombinado: string; // string para o formulário
  situacao: SituacaoAtendimento;
  observacao: string;
  dataRecebimento: string;
  valorRecebido: string;
}

export interface TotaisMes {
  previsto: number;
  recebido: number;
  pendente: number;
  cancelados: number;
  canceladosValor: number;
}

export interface AgendaSemanal {
  semanaInicio: string; // ISO date da segunda-feira
  dias: Record<string, Atendimento[]>; // key: YYYY-MM-DD
}

export const SITUACAO_LABELS: Record<SituacaoAtendimento, string> = {
  previsto: 'Previsto',
  realizado: 'Realizado',
  pago: 'Pago',
  cancelado: 'Cancelado',
};

export const SITUACAO_CORES: Record<SituacaoAtendimento, string> = {
  previsto: 'bg-blue-100 text-blue-800',
  realizado: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};
