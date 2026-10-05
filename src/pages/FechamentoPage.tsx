import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  formatCurrency,
  getMesAtual,
  addMonths,
  getMesLabel,
  formatDate,
  formatTime,
} from '@/lib/utils';
import {
  selectAtendimentosParaHistorico,
  selectTotaisMes,
  selectMesesComAtendimentos,
  updateSituacao,
  registrarPagamento,
} from '@/features/atendimentos';
import type { AppDispatch, RootState } from '@/app/store';
import { SITUACAO_LABELS, SITUACAO_CORES } from '@/features/atendimentos/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Alert, AlertDescription } from '@/components/ui/Alert';

const SITUACOES = [
  { value: 'todas', label: 'Todas' },
  { value: 'previsto', label: 'Previsto' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'pago', label: 'Pago' },
  { value: 'cancelado', label: 'Cancelado' },
];

export function FechamentoPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();

  const mesInicial = searchParams.get('mes') || getMesAtual();
  const atendimentoInicial = searchParams.get('atendimento') || null;

  const [mesAtual, setMesAtual] = useState(mesInicial);
  const [filtroSituacao, setFiltroSituacao] = useState('todas');
  const [pagamentoId, setPagamentoId] = useState<string | null>(null);
  const [scrollToAtendimento, setScrollToAtendimento] = useState<string | null>(atendimentoInicial);

  const atendimentos = useSelector((state: RootState) =>
    selectAtendimentosParaHistorico(state, { mes: mesAtual, situacao: filtroSituacao })
  );
  const totais = useSelector((state: RootState) => selectTotaisMes(state, mesAtual));
  const mesesDisponiveis = useSelector((state: RootState) => selectMesesComAtendimentos(state));

  useEffect(() => {
    if (scrollToAtendimento) {
      const element = document.getElementById(`atendimento-${scrollToAtendimento}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-primary');
        setTimeout(() => element.classList.remove('ring-2', 'ring-primary'), 3000);
      }
      setScrollToAtendimento(null);
      const params = new URLSearchParams(searchParams);
      params.delete('atendimento');
      setSearchParams(params, { replace: true });
    }
  }, [atendimentos, scrollToAtendimento, searchParams, setSearchParams]);

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

  const handleSituacaoChange = (
    id: string,
    situacao: 'previsto' | 'realizado' | 'pago' | 'cancelado'
  ) => {
    dispatch(updateSituacao({ id, situacao }));
  };

  const handleMesChange = (mes: string) => {
    setMesAtual(mes);
    const params = new URLSearchParams(searchParams);
    params.set('mes', mes);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold">{getMesLabel(mesAtual)}</h2>
          <p className="text-sm text-muted-foreground">Fechamento e histórico do mês</p>
        </div>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Previsto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totais.previsto)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totais.recebido)}
            </div>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cancelados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totais.cancelados}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totais.canceladosValor)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fechamento" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="fechamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atendimentos do Mês</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Label htmlFor="filtro-situacao" className="text-sm font-medium">
                  Filtrar por:
                </Label>
                <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                  <SelectTrigger id="filtro-situacao" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SITUACOES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {atendimentos.length === 0 ? (
                <Alert variant="warning">
                  <AlertDescription className="flex flex-col gap-2">
                    <p>Nenhum atendimento encontrado para este filtro.</p>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3" role="list">
                  {atendimentos.map((atendimento) => (
                    <div
                      key={atendimento.id}
                      id={`atendimento-${atendimento.id}`}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted/50 rounded-lg border"
                      role="listitem"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-medium truncate">{atendimento.cliente}</p>
                          <Badge
                            variant={
                              atendimento.situacao === 'pago'
                                ? 'success'
                                : atendimento.situacao === 'cancelado'
                                  ? 'destructive'
                                  : atendimento.situacao === 'realizado'
                                    ? 'warning'
                                    : 'default'
                            }
                            className={SITUACAO_CORES[atendimento.situacao]}
                          >
                            {SITUACAO_LABELS[atendimento.situacao]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {atendimento.endereco}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                          <span>
                            {formatDate(atendimento.data)} às {formatTime(atendimento.horario)}
                          </span>
                          {atendimento.duracao && <span>· {atendimento.duracao}</span>}
                          <span className="font-medium text-foreground">
                            {formatCurrency(atendimento.valorCombinado)}
                          </span>
                          {atendimento.situacao === 'pago' && atendimento.valorRecebido && (
                            <span className="text-green-600">
                              Recebido: {formatCurrency(atendimento.valorRecebido)} em{' '}
                              {formatDate(atendimento.dataRecebimento!)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {atendimento.situacao === 'previsto' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSituacaoChange(atendimento.id, 'realizado')}
                            >
                              Realizado
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSituacaoChange(atendimento.id, 'cancelado')}
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                        {atendimento.situacao === 'realizado' && (
                          <>
                            <Button size="sm" onClick={() => setPagamentoId(atendimento.id)}>
                              Marcar Pago
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSituacaoChange(atendimento.id, 'cancelado')}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSituacaoChange(atendimento.id, 'previsto')}
                            >
                              Voltar
                            </Button>
                          </>
                        )}
                        {atendimento.situacao === 'pago' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSituacaoChange(atendimento.id, 'realizado')}
                          >
                            Desfazer pagamento
                          </Button>
                        )}
                        {atendimento.situacao === 'cancelado' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSituacaoChange(atendimento.id, 'previsto')}
                          >
                            Reativar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {pagamentoId && (
            <Dialog open={!!pagamentoId} onOpenChange={(open) => !open && setPagamentoId(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Pagamento</DialogTitle>
                </DialogHeader>
                <PagamentoForm
                  atendimentoId={pagamentoId}
                  onSuccess={() => setPagamentoId(null)}
                  onCancel={() => setPagamentoId(null)}
                />
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico Completo</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {atendimentos.length === 0 ? (
                <Alert variant="warning">
                  <AlertDescription>
                    Nenhum atendimento no histórico para este mês/filtro.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3" role="list">
                  {atendimentos.map((atendimento) => (
                    <div
                      key={atendimento.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted/50 rounded-lg border"
                      role="listitem"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-medium truncate">{atendimento.cliente}</p>
                          <Badge
                            variant={
                              atendimento.situacao === 'pago'
                                ? 'success'
                                : atendimento.situacao === 'cancelado'
                                  ? 'destructive'
                                  : atendimento.situacao === 'realizado'
                                    ? 'warning'
                                    : 'default'
                            }
                            className={SITUACAO_CORES[atendimento.situacao]}
                          >
                            {SITUACAO_LABELS[atendimento.situacao]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {atendimento.endereco}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                          <span>
                            {formatDate(atendimento.data)} às {formatTime(atendimento.horario)}
                          </span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(atendimento.valorCombinado)}
                          </span>
                          {atendimento.situacao === 'pago' && atendimento.valorRecebido && (
                            <span className="text-green-600">
                              Recebido: {formatCurrency(atendimento.valorRecebido)} em{' '}
                              {formatDate(atendimento.dataRecebimento!)}
                            </span>
                          )}
                          {atendimento.situacao === 'cancelado' && atendimento.observacao && (
                            <span className="text-red-600">Motivo: {atendimento.observacao}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PagamentoForm({
  atendimentoId,
  onSuccess,
  onCancel,
}: {
  atendimentoId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(valor.replace(',', '.'));
    if (!isNaN(valorNum) && valorNum > 0) {
      const valorCentavos = Math.round(valorNum * 100);
      dispatch(
        registrarPagamento({
          id: atendimentoId,
          valorRecebido: valorCentavos,
          dataRecebimento: data,
        })
      );
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="valorRecebido">Valor recebido *</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
          <Input
            id="valorRecebido"
            placeholder="0,00"
            className="pl-7"
            value={valor}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              const formatted = v ? (parseInt(v, 10) / 100).toFixed(2).replace('.', ',') : '';
              setValor(formatted);
            }}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dataRecebimento">Data do recebimento *</Label>
        <Input
          id="dataRecebimento"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Confirmar Pagamento</Button>
      </DialogFooter>
    </form>
  );
}
