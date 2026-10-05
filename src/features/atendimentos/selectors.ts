import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { Atendimento, TotaisMes, AgendaSemanal } from './types';

const selectAtendimentosState = (state: RootState) => state.atendimentos;

export const selectAtendimentos = createSelector(
  [selectAtendimentosState],
  (atendimentosState) => atendimentosState.items
);

export const selectAtendimentosByMes = createSelector(
  [selectAtendimentos, (_: RootState, mes: string) => mes],
  (atendimentos: Atendimento[], mes: string) => {
    return atendimentos.filter((a: Atendimento) => a.data.startsWith(mes));
  }
);

export const selectTotaisMes = createSelector(
  [selectAtendimentos, (_: RootState, mes: string) => mes],
  (atendimentos: Atendimento[], mes: string): TotaisMes => {
    const doMes = atendimentos.filter((a: Atendimento) => a.data.startsWith(mes));
    const validos = doMes.filter((a: Atendimento) => a.situacao !== 'cancelado');

    const previsto = validos.reduce((sum: number, a: Atendimento) => sum + a.valorCombinado, 0);
    const recebido = doMes
      .filter((a: Atendimento) => a.situacao === 'pago' && a.valorRecebido)
      .reduce((sum: number, a: Atendimento) => sum + (a.valorRecebido || 0), 0);
    const pendente = validos
      .filter((a: Atendimento) => a.situacao !== 'pago')
      .reduce((sum: number, a: Atendimento) => sum + a.valorCombinado, 0);
    const cancelados = doMes.filter((a: Atendimento) => a.situacao === 'cancelado').length;
    const canceladosValor = doMes
      .filter((a: Atendimento) => a.situacao === 'cancelado')
      .reduce((sum: number, a: Atendimento) => sum + a.valorCombinado, 0);

    return { previsto, recebido, pendente, cancelados, canceladosValor };
  }
);

export const selectAgendaSemanal = createSelector(
  [selectAtendimentos, (_: RootState, semanaInicio: string) => semanaInicio],
  (atendimentos: Atendimento[], semanaInicio: string): AgendaSemanal => {
    const inicio = new Date(semanaInicio);
    const dias: Record<string, Atendimento[]> = {};

    for (let i = 0; i < 7; i++) {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + i);
      const key = data.toISOString().split('T')[0];
      dias[key] = [];
    }

    const fimSemana = new Date(inicio);
    fimSemana.setDate(inicio.getDate() + 6);
    const fimStr = fimSemana.toISOString().split('T')[0];

    const daSemana = atendimentos.filter(
      (a: Atendimento) => a.data >= semanaInicio && a.data <= fimStr
    );

    daSemana.forEach((a: Atendimento) => {
      if (dias[a.data]) {
        dias[a.data].push(a);
      }
    });

    Object.keys(dias).forEach((key) => {
      dias[key].sort((a: Atendimento, b: Atendimento) => a.horario.localeCompare(b.horario));
    });

    return { semanaInicio, dias };
  }
);

export const selectAtendimentoById = createSelector(
  [selectAtendimentos, (_: RootState, id: string) => id],
  (atendimentos: Atendimento[], id: string) => atendimentos.find((a: Atendimento) => a.id === id)
);

export const selectAtendimentosFuturos = createSelector(
  [selectAtendimentos],
  (atendimentos: Atendimento[]) => {
    const hoje = new Date().toISOString().split('T')[0];
    return atendimentos
      .filter((a: Atendimento) => a.data >= hoje && a.situacao !== 'cancelado')
      .sort(
        (a: Atendimento, b: Atendimento) =>
          a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario)
      );
  }
);

export const selectAtendimentosParaHistorico = createSelector(
  [selectAtendimentos, (_: RootState, filtro?: { mes?: string; situacao?: string }) => filtro],
  (atendimentos: Atendimento[], { mes, situacao }: { mes?: string; situacao?: string } = {}) => {
    let resultado = [...atendimentos];

    if (mes) {
      resultado = resultado.filter((a: Atendimento) => a.data.startsWith(mes));
    }

    if (situacao && situacao !== 'todas') {
      resultado = resultado.filter((a: Atendimento) => a.situacao === situacao);
    }

    return resultado.sort(
      (a: Atendimento, b: Atendimento) =>
        b.data.localeCompare(a.data) || b.horario.localeCompare(a.horario)
    );
  }
);

export const selectMesesComAtendimentos = createSelector(
  [selectAtendimentos],
  (atendimentos: Atendimento[]) => {
    const meses = new Set<string>();
    atendimentos.forEach((a: Atendimento) => {
      const mes = a.data.substring(0, 7);
      meses.add(mes);
    });
    return Array.from(meses).sort().reverse();
  }
);
