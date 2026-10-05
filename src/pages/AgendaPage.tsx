import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  formatDate,
  formatTime,
  formatCurrency,
  getWeekStart,
  addWeeks,
  formatDateLong,
  generateWhatsAppMessage,
  openWhatsApp,
} from '@/lib/utils';
import { initialize, selectAgendaSemanal } from '@/features/atendimentos';
import type { AppDispatch, RootState } from '@/app/store';
import { AtendimentoForm } from '@/features/atendimentos/components/AtendimentoForm';
import { SITUACAO_LABELS, SITUACAO_CORES } from '@/features/atendimentos/types';

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function AgendaPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [semanaInicio, setSemanaInicio] = useState(getWeekStart());
  const [editingId, setEditingId] = useState<string | null>(null);
  const agenda = useSelector((state: RootState) => selectAgendaSemanal(state, semanaInicio));
  const hoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    dispatch(initialize());
  }, [dispatch]);

  const semanaAnterior = () => setSemanaInicio((s) => addWeeks(s, -1));
  const proximaSemana = () => setSemanaInicio((s) => addWeeks(s, 1));
  const estaSemana = () => setSemanaInicio(getWeekStart());

  const abrirWhatsApp = (atendimento: { cliente: string; data: string; horario: string }) => {
    const mensagem = generateWhatsAppMessage(
      atendimento.cliente,
      atendimento.data,
      atendimento.horario
    );
    openWhatsApp(mensagem);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm text-muted-foreground">
            Semana de {formatDate(semanaInicio)} a{' '}
            {formatDate(
              addWeeks(semanaInicio, 1)
                .split('T')[0]
                .replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2')
            )}
          </p>
          <h2 className="text-xl font-semibold">{formatDateLong(semanaInicio)}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={semanaAnterior} aria-label="Semana anterior">
            ←
          </Button>
          <Button variant="outline" size="sm" onClick={estaSemana} aria-label="Esta semana">
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={proximaSemana} aria-label="Próxima semana">
            →
          </Button>
        </div>
      </div>

      <div className="grid gap-4" role="list" aria-label="Dias da semana">
        {DIAS_SEMANA.map((dia, index) => {
          const data = new Date(semanaInicio);
          data.setDate(data.getDate() + index);
          const dataStr = data.toISOString().split('T')[0];
          const atendimentosDoDia = agenda.dias[dataStr] || [];
          const isHoje = dataStr === hoje;

          return (
            <Card key={dataStr} className={isHoje ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={isHoje ? 'font-medium text-primary' : 'font-medium'}>
                      {dia} {formatDate(dataStr)}
                    </span>
                    {isHoje && (
                      <Badge variant="success" className="text-xs">
                        Hoje
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
                              onClick={() => abrirWhatsApp(atendimento)}
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
                            onClick={() => setEditingId(atendimento.id)}
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
