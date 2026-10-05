import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { formatCurrency, getMesAtual, addMonths, getMesLabel } from '@/lib/utils';
import {
  selectTotaisMes,
  selectMesesComAtendimentos,
  selectAtendimentos,
} from '@/features/atendimentos';
import type { RootState } from '@/app/store';
import { AtendimentoForm } from '@/features/atendimentos/components/AtendimentoForm';

export function ResumoPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const mesInicial = searchParams.get('mes') || getMesAtual();
  const [mesAtual, setMesAtual] = useState(mesInicial);

  const totais = useSelector((state: RootState) => selectTotaisMes(state, mesAtual));
  const mesesDisponiveis = useSelector((state: RootState) => selectMesesComAtendimentos(state));
  const atendimentos = useSelector((state: RootState) => selectAtendimentos(state));
  const temAtendimentosNoMes = atendimentos.some((a) => a.data.startsWith(mesAtual));

  const progresso = totais.previsto > 0 ? (totais.recebido / totais.previsto) * 100 : 0;

  const diasTrabalhados = useMemo(() => {
    const diasComAtendimentoRealizado = new Set<string>();
    atendimentos
      .filter(
        (a) => a.data.startsWith(mesAtual) && (a.situacao === 'realizado' || a.situacao === 'pago')
      )
      .forEach((a) => diasComAtendimentoRealizado.add(a.data));
    return diasComAtendimentoRealizado.size;
  }, [atendimentos, mesAtual]);

  const mesAnterior = () => {
    const novoMes = addMonths(mesAtual, -1);
    setMesAtual(novoMes);
    const params = new URLSearchParams(searchParams);
    params.set('mes', novoMes);
    setSearchParams(params, { replace: true });
  };
  const proximoMes = () => {
    const novoMes = addMonths(mesAtual, 1);
    setMesAtual(novoMes);
    const params = new URLSearchParams(searchParams);
    params.set('mes', novoMes);
    setSearchParams(params, { replace: true });
  };

  const handleMesChange = (mes: string) => {
    setMesAtual(mes);
    const params = new URLSearchParams(searchParams);
    params.set('mes', mes);
    setSearchParams(params, { replace: true });
  };

  if (!temAtendimentosNoMes && mesesDisponiveis.length > 0) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{getMesLabel(mesAtual)}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={mesAnterior} aria-label="Mês anterior">
              ←
            </Button>
            <Select value={mesAtual} onValueChange={handleMesChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mesesDisponiveis.map((mes: string) => (
                  <SelectItem key={mes} value={mes}>
                    {getMesLabel(mes)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={proximoMes} aria-label="Próximo mês">
              →
            </Button>
          </div>
        </div>

        <Alert variant="warning">
          <AlertDescription className="flex flex-col gap-3">
            <div>
              <p className="font-medium">Nenhum atendimento neste mês</p>
              <p className="text-sm opacity-80">
                Adicione seu primeiro atendimento para começar a acompanhar.
              </p>
            </div>
            <AtendimentoForm initialData={{ data: `${mesAtual}-01` }} onSuccess={() => {}} />
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{getMesLabel(mesAtual)}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={mesAnterior} aria-label="Mês anterior">
            ←
          </Button>
          <Select value={mesAtual} onValueChange={handleMesChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mesesDisponiveis.map((mes: string) => (
                <SelectItem key={mes} value={mes}>
                  {getMesLabel(mes)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={proximoMes} aria-label="Próximo mês">
            →
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Previsto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totais.previsto)}</div>
            <p className="text-xs text-muted-foreground">Serviços válidos do mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totais.recebido)}
            </div>
            <p className="text-xs text-muted-foreground">Pagamentos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totais.pendente)}
            </div>
            <p className="text-xs text-muted-foreground">Ainda não recebidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cancelados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totais.cancelados}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totais.canceladosValor)} em valor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dias Trabalhados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{diasTrabalhados}</div>
            <p className="text-xs text-muted-foreground">Dias com atendimento realizado</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progresso do Mês</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Recebido de Previsto</span>
            <span className="font-medium">
              {formatCurrency(totais.recebido)} de {formatCurrency(totais.previsto)}
            </span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(progresso, 100)}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progresso)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso de recebimento"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {Math.round(progresso)}% concluído
          </p>
        </CardContent>
      </Card>

      <AtendimentoForm initialData={{ data: `${mesAtual}-01` }} onSuccess={() => {}} />
    </div>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
