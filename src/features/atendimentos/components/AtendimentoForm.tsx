import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { formatCurrency } from '@/lib/utils';
import { atendimentoFormSchema } from '@/features/atendimentos/schemas';
import { useData } from '@/context/DataContext';
import { useAppSelector } from '@/app/hooks';
import { selectAtendimentoById } from '@/features/atendimentos/selectors';

type AtendimentoFormData = {
  cliente: string;
  endereco: string;
  data: string;
  horario: string;
  duracao: string;
  valorCombinado: string;
  situacao: 'previsto' | 'realizado' | 'pago' | 'cancelado';
  observacao: string;
  dataRecebimento: string;
  valorRecebido: string;
};

interface AtendimentoFormProps {
  initialData?: Partial<AtendimentoFormData>;
  editingId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return (num / 100).toFixed(2).replace('.', ',');
}

export function AtendimentoForm({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}: AtendimentoFormProps) {
  const { addAtendimento, updateAtendimento } = useData();
  const existingAtendimento = useAppSelector((state) =>
    editingId ? selectAtendimentoById(state, editingId) : undefined
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: AtendimentoFormData = {
    cliente: '',
    endereco: '',
    data: initialData?.data || new Date().toISOString().split('T')[0],
    horario: '08:00',
    duracao: '',
    valorCombinado: '',
    situacao: 'previsto',
    observacao: '',
    dataRecebimento: '',
    valorRecebido: '',
    ...(existingAtendimento
      ? {
          cliente: existingAtendimento.cliente,
          endereco: existingAtendimento.endereco,
          data: existingAtendimento.data,
          horario: existingAtendimento.horario,
          duracao: existingAtendimento.duracao || '',
          valorCombinado: formatCurrency(existingAtendimento.valorCombinado),
          situacao: existingAtendimento.situacao,
          observacao: existingAtendimento.observacao || '',
          dataRecebimento: existingAtendimento.dataRecebimento || '',
          valorRecebido: existingAtendimento.valorRecebido
            ? formatCurrency(existingAtendimento.valorRecebido)
            : '',
        }
      : {}),
    ...initialData,
  };

  const form = useForm<AtendimentoFormData>({
    resolver: zodResolver(
      atendimentoFormSchema
    ) as import('react-hook-form').Resolver<AtendimentoFormData>,
    defaultValues,
    mode: 'onChange',
  });

  const isEditing = !!editingId;

  const valorCombinadoWatch = useWatch({ control: form.control, name: 'valorCombinado' });
  const valorRecebidoWatch = useWatch({ control: form.control, name: 'valorRecebido' });

  useEffect(() => {
    if (valorCombinadoWatch) {
      const formatted = formatCurrencyInput(valorCombinadoWatch);
      if (formatted !== valorCombinadoWatch) {
        form.setValue('valorCombinado', formatted, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [valorCombinadoWatch, form]);

  useEffect(() => {
    if (valorRecebidoWatch) {
      const formatted = formatCurrencyInput(valorRecebidoWatch);
      if (formatted !== valorRecebidoWatch) {
        form.setValue('valorRecebido', formatted, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [valorRecebidoWatch, form]);

  const onSubmit = async (data: AtendimentoFormData) => {
    console.log('onSubmit chamado com:', data);
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const atendimentoData = {
        cliente: data.cliente,
        endereco: data.endereco,
        data: data.data,
        horario: data.horario,
        duracao: data.duracao || undefined,
        valorCombinado: Math.round(parseFloat(data.valorCombinado.replace(',', '.')) * 100),
        situacao: data.situacao,
        observacao: data.observacao || undefined,
        dataRecebimento: data.dataRecebimento || undefined,
        valorRecebido: data.valorRecebido
          ? Math.round(parseFloat(data.valorRecebido.replace(',', '.')) * 100)
          : undefined,
      };
      console.log('Dados processados:', atendimentoData);
      if (isEditing && editingId) {
        console.log('Atualizando atendimento:', editingId);
        await updateAtendimento(editingId, atendimentoData);
      } else {
        console.log('Criando novo atendimento');
        await addAtendimento(atendimentoData);
      }
      console.log('Sucesso, resetando formulário');
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar atendimento:', error);
      setSubmitError('Erro ao salvar. Verifique os campos e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPago = form.watch('situacao') === 'pago';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? 'Editar Atendimento' : 'Novo Atendimento'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="form-atendimento">
          {submitError && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          {form.formState.errors.dataRecebimento && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription>{form.formState.errors.dataRecebimento.message}</AlertDescription>
            </Alert>
          )}
          {form.formState.errors.valorRecebido && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription>{form.formState.errors.valorRecebido.message}</AlertDescription>
            </Alert>
          )}
          {form.formState.errors.root && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription>
                {form.formState.errors.root?.message || 'Erro de validação'}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="cliente">Nome do cliente ou da casa *</Label>
            <Input
              id="cliente"
              placeholder="Ex: Maria Silva"
              {...form.register('cliente')}
              autoComplete="name"
            />
            {form.formState.errors.cliente && (
              <Alert variant="destructive" className="text-sm p-2">
                <AlertDescription>{form.formState.errors.cliente.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço *</Label>
            <Input
              id="endereco"
              placeholder="Ex: Rua das Flores, 123 - Centro"
              {...form.register('endereco')}
              autoComplete="street-address"
            />
            {form.formState.errors.endereco && (
              <Alert variant="destructive" className="text-sm p-2">
                <AlertDescription>{form.formState.errors.endereco.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input id="data" type="date" {...form.register('data')} />
              {form.formState.errors.data && (
                <Alert variant="destructive" className="text-sm p-2">
                  <AlertDescription>{form.formState.errors.data.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario">Horário *</Label>
              <Input id="horario" type="time" {...form.register('horario')} />
              {form.formState.errors.horario && (
                <Alert variant="destructive" className="text-sm p-2">
                  <AlertDescription>{form.formState.errors.horario.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (opcional)</Label>
              <Input id="duracao" placeholder="Ex: 4h, 3h30min" {...form.register('duracao')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorCombinado">Valor combinado *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="valorCombinado"
                  placeholder="0,00"
                  className="pl-7"
                  {...form.register('valorCombinado')}
                />
              </div>
              {form.formState.errors.valorCombinado && (
                <Alert variant="destructive" className="text-sm p-2">
                  <AlertDescription>
                    {form.formState.errors.valorCombinado.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="situacao">Situação *</Label>
            <Select
              onValueChange={(value) =>
                form.setValue('situacao', value as 'previsto' | 'realizado' | 'pago' | 'cancelado')
              }
              defaultValue={form.getValues('situacao')}
            >
              <SelectTrigger id="situacao">
                <SelectValue placeholder="Selecione a situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="previsto">Previsto</SelectItem>
                <SelectItem value="realizado">Realizado</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.situacao && (
              <Alert variant="destructive" className="text-sm p-2">
                <AlertDescription>{form.formState.errors.situacao.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              placeholder="Detalhes adicionais..."
              rows={3}
              {...form.register('observacao')}
            />
          </div>

          {isPago && (
            <div id="campos-pagamento" className="space-y-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dataRecebimento">Data do recebimento *</Label>
                <Input id="dataRecebimento" type="date" {...form.register('dataRecebimento')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorRecebido">Valor recebido *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="valorRecebido"
                    placeholder="0,00"
                    className="pl-7"
                    {...form.register('valorRecebido')}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar Alterações'
                  : 'Adicionar Atendimento'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
