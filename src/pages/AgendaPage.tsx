import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  formatDate,
  formatTime,
  formatCurrency,
  getWeekStart,
  formatDateLong,
  generateWhatsAppMessage,
  openWhatsApp,
  getMesAtual,
  getMesLabel,
} from '@/lib/utils';
import { selectAgendaSemanal, selectAtendimentos } from '@/features/atendimentos';
import type { RootState } from '@/app/store';
import { AtendimentoForm } from '@/features/atendimentos/components/AtendimentoForm';
import { SITUACAO_LABELS, SITUACAO_CORES } from '@/features/atendimentos/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function AgendaPage() {
  const [semanaInicio] = useState(getWeekStart());
  const [mesAtual, setMesAtual] = useState(getMesAtual());
  const [visualizacao, setVisualizacao] = useState<'semanal' | 'mensal'>('semanal');
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [mesPopoverAberto, setMesPopoverAberto] = useState(false);
  const [anoPopover, setAnoPopover] = useState(() => new Date().getFullYear());
  const [editingId, setEditingId] = useState<string | null>(null);
  const agenda = useSelector((state: RootState) => selectAgendaSemanal(state, semanaInicio));
  const todosAtendimentos = useSelector((state: RootState) => selectAtendimentos(state));
  const hoje = new Date().toISOString().split('T')[0];
  const navigate = useNavigate();

  const diasDoMes = useMemo(() => {
    const [ano, mes] = mesAtual.split('-').map(Number);
    const ultimoDia = new Date(ano, mes, 0);
    const dias: { data: string; atendimentos: typeof todosAtendimentos }[] = [];

    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const data = new Date(ano, mes - 1, d);
      const dataStr = data.toISOString().split('T')[0];
      const atendimentosDoDia = todosAtendimentos.filter((a) => a.data === dataStr);
      dias.push({ data: dataStr, atendimentos: atendimentosDoDia });
    }
    return dias;
  }, [mesAtual, todosAtendimentos]);

  const valorTotalDia = (atendimentos: typeof todosAtendimentos) =>
    atendimentos
      .filter((a) => a.situacao !== 'cancelado')
      .reduce((sum, a) => sum + a.valorCombinado, 0);

  const celulasCalendario = useMemo(() => {
    const [ano, mes] = mesAtual.split('-').map(Number);
    const primeiroDiaMes = new Date(ano, mes - 1, 1);
    const diaSemanaPrimeiro = primeiroDiaMes.getDay();
    const offsetInicio = diaSemanaPrimeiro === 0 ? 6 : diaSemanaPrimeiro - 1;

    const celulas: Array<{
      data: string;
      atendimentos: typeof todosAtendimentos;
      isOffset: boolean;
    }> = [];

    for (let i = 0; i < offsetInicio; i++) {
      celulas.push({ data: '', atendimentos: [], isOffset: true });
    }

    diasDoMes.forEach((dia) => {
      celulas.push({ ...dia, isOffset: false });
    });

    return celulas;
  }, [diasDoMes, mesAtual]);

  const abrirWhatsApp = (atendimento: { cliente: string; data: string; horario: string }) => {
    const mensagem = generateWhatsAppMessage(
      atendimento.cliente,
      atendimento.data,
      atendimento.horario
    );
    openWhatsApp(mensagem);
  };

  const handleAtendimentoClick = (atendimento: (typeof todosAtendimentos)[0]) => {
    const mesAtendimento = atendimento.data.substring(0, 7);
    navigate(`/fechamento?mes=${mesAtendimento}&atendimento=${atendimento.id}`);
  };

  const handleDiaClick = (data: string) => {
    setDiaSelecionado(data === diaSelecionado ? null : data);
  };

  const mesLabel = getMesLabel(mesAtual);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Popover open={mesPopoverAberto} onOpenChange={setMesPopoverAberto}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-10 px-3 gap-2" aria-label="Selecionar mês e ano">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-lg">{mesLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setAnoPopover((a) => a - 1);
                      const novoMes = `${anoPopover - 1}-${String(new Date(mesAtual).getMonth() + 1).padStart(2, '0')}`;
                      setMesAtual(novoMes);
                    }}
                    aria-label="Ano anterior"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </Button>
                  <span className="font-medium text-lg">{anoPopover}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setAnoPopover((a) => a + 1);
                      const novoMes = `${anoPopover + 1}-${String(new Date(mesAtual).getMonth() + 1).padStart(2, '0')}`;
                      setMesAtual(novoMes);
                    }}
                    aria-label="Próximo ano"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-1 px-2 pb-2">
                  {MESES.map((mes, index) => {
                    const mesNum = index + 1;
                    const mesStr = `${anoPopover}-${String(mesNum).padStart(2, '0')}`;
                    const isAtual = mesStr === mesAtual;
                    return (
                      <Button
                        key={mes}
                        variant={isAtual ? 'default' : 'ghost'}
                        size="sm"
                        className="h-10 text-sm"
                        onClick={() => {
                          setMesAtual(mesStr);
                          setMesPopoverAberto(false);
                        }}
                      >
                        {mes.substring(0, 3)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {diaSelecionado && (
            <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium">
              {formatDateLong(diaSelecionado)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={visualizacao === 'semanal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVisualizacao('semanal')}
            aria-label="Visualização semanal"
          >
            Semana
          </Button>
          <Button
            variant={visualizacao === 'mensal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVisualizacao('mensal')}
            aria-label="Visualização mensal"
          >
            Mês
          </Button>
        </div>
      </div>

      {visualizacao === 'semanal' ? (
        <div className="grid gap-4" role="list" aria-label="Dias da semana">
          {DIAS_SEMANA.map((dia, index) => {
            const data = new Date(semanaInicio);
            data.setDate(data.getDate() + index);
            const dataStr = data.toISOString().split('T')[0];
            const atendimentosDoDia = agenda.dias[dataStr] || [];
            const isHoje = dataStr === hoje;
            const isSelecionado = dataStr === diaSelecionado;

            return (
              <Card
                key={dataStr}
                className={cn(
                  isHoje && 'ring-2 ring-primary',
                  isSelecionado && 'ring-2 ring-purple-500'
                )}
                onClick={() => handleDiaClick(dataStr)}
                style={{ cursor: 'pointer' }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          isHoje ? 'font-medium text-primary' : 'font-medium',
                          isSelecionado && 'text-purple-600'
                        )}
                      >
                        {dia} {formatDate(dataStr)}
                      </span>
                      {isHoje && (
                        <Badge variant="success" className="text-xs">
                          Hoje
                        </Badge>
                      )}
                      {isSelecionado && !isHoje && (
                        <Badge variant="default" className="text-xs bg-purple-100 text-purple-800">
                          Selecionado
                        </Badge>
                      )}
                    </div>
                    {atendimentosDoDia.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {atendimentosDoDia.length} atendimento
                        {atendimentosDoDia.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {atendimentosDoDia.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">
                      Nenhum atendimento agendado
                    </p>
                  ) : (
                    <div className="space-y-3" role="list">
                      {atendimentosDoDia.map((atendimento) => (
                        <div
                          key={atendimento.id}
                          className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border"
                          role="listitem"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAtendimentoClick(atendimento);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
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
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>{formatTime(atendimento.horario)}</span>
                              {atendimento.duracao && <span>· {atendimento.duracao}</span>}
                              <span className="font-medium text-foreground">
                                {formatCurrency(atendimento.valorCombinado)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {atendimento.situacao !== 'cancelado' && atendimento.data >= hoje && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirWhatsApp(atendimento);
                                }}
                                aria-label={`Confirmar ${atendimento.cliente} via WhatsApp`}
                                className="text-green-600 hover:text-green-700"
                              >
                                <svg
                                  className="w-5 h-5"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a3.034 3.034 0 0 0 0-.063 1.42 1.42 0 0 1 .02-.02c.183-.183.183-.475 0-.658a.8.8 0 0 0-.01-.011h-.004a1.27 1.27 0 0 1 0 .752" />
                                </svg>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(atendimento.id);
                              }}
                              aria-label={`Editar ${atendimento.cliente}`}
                            >
                              <svg
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                aria-hidden="true"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground pb-2 border-b"
            role="row"
          >
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="py-2" role="columnheader">
                {dia}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1" role="grid">
            {celulasCalendario.map(({ data, atendimentos, isOffset }, index) => {
              if (isOffset) {
                return (
                  <div
                    key={`offset-${index}`}
                    className="min-h-[100px] border rounded-lg bg-muted/30"
                    role="gridcell"
                  />
                );
              }
              const dataObj = new Date(data + 'T00:00:00');
              const isHoje = data === hoje;
              const isSelecionado = data === diaSelecionado;
              const valorDia = valorTotalDia(atendimentos);
              const temAtendimentos = atendimentos.length > 0;

              return (
                <div
                  key={data}
                  className={cn(
                    'relative min-h-[100px] p-2 border rounded-lg bg-background',
                    isHoje && 'ring-2 ring-primary',
                    isSelecionado && 'ring-2 ring-purple-500'
                  )}
                  role="gridcell"
                  onClick={() => handleDiaClick(data)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        isHoje ? 'font-medium text-primary' : 'font-medium',
                        isSelecionado && 'text-purple-600'
                      )}
                    >
                      {dataObj.getDate()}
                    </span>
                    {temAtendimentos && (
                      <span className="text-xs text-muted-foreground">
                        {atendimentos.length} at
                        {atendimentos.length > 1 ? 'endimentos' : 'endimento'}
                      </span>
                    )}
                  </div>
                  {valorDia > 0 && (
                    <div className="text-sm font-medium text-green-600 mb-1">
                      {formatCurrency(valorDia)}
                    </div>
                  )}
                  <div className="space-y-1 max-h-[60px] overflow-y-auto">
                    {atendimentos.map((atendimento) => (
                      <div
                        key={atendimento.id}
                        className="text-xs p-1 bg-muted/50 rounded truncate"
                        title={`${atendimento.cliente} - ${formatTime(atendimento.horario)} - ${formatCurrency(atendimento.valorCombinado)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAtendimentoClick(atendimento);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="font-medium">{atendimento.cliente}</span>
                        <span className="ml-1 text-muted-foreground">
                          {formatTime(atendimento.horario)}{' '}
                          {formatCurrency(atendimento.valorCombinado)}
                        </span>
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
                          className={`${SITUACAO_CORES[atendimento.situacao]} ml-1`}
                        >
                          {SITUACAO_LABELS[atendimento.situacao]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {atendimentos.length === 0 && (
                    <p className="text-center text-muted-foreground text-xs py-4">Livre</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editingId && (
        <AtendimentoForm
          editingId={editingId}
          onSuccess={() => setEditingId(null)}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
