import { z } from 'zod';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)')
  .optional()
  .or(z.literal('').transform(() => undefined));

const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Horário inválido (HH:mm)')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const atendimentoSchema = z.object({
  id: z.string().uuid(),
  cliente: z.string().min(1, 'Nome do cliente é obrigatório').max(100),
  endereco: z.string().min(1, 'Endereço é obrigatório').max(200),
  data: dateString,
  horario: timeString,
  duracao: z.string().max(20).optional(),
  valorCombinado: z.number().int().min(1, 'Valor deve ser maior que zero'),
  situacao: z.enum(['previsto', 'realizado', 'pago', 'cancelado']),
  observacao: z.string().max(500).optional(),
  dataRecebimento: dateString,
  valorRecebido: z.number().int().min(0).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const atendimentoFormSchemaBase = z.object({
  cliente: z.string().min(1, 'Nome do cliente é obrigatório').max(100),
  endereco: z.string().min(1, 'Endereço é obrigatório').max(200),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  horario: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (HH:mm)'),
  duracao: z.string().max(20).optional(),
  valorCombinado: z
    .string()
    .min(1, 'Valor é obrigatório')
    .refine(
      (val) => {
        const num = parseFloat(val.replace(',', '.'));
        return !isNaN(num) && num > 0;
      },
      { message: 'Valor deve ser maior que zero' }
    ),
  situacao: z.enum(['previsto', 'realizado', 'pago', 'cancelado']),
  observacao: z.string().max(500).optional(),
  dataRecebimento: dateString,
  valorRecebido: z
    .string()
    .optional()
    .or(z.literal('').transform(() => undefined))
    .refine(
      (val) => {
        if (!val) return true;
        const num = parseFloat(val.replace(',', '.'));
        return !isNaN(num) && num >= 0;
      },
      { message: 'Valor recebido inválido' }
    ),
});

export const atendimentoFormSchema = atendimentoFormSchemaBase.refine(
  (data) => {
    if (data.situacao === 'pago') {
      return (
        data.dataRecebimento &&
        data.valorRecebido &&
        parseFloat(data.valorRecebido.replace(',', '.')) > 0
      );
    }
    return true;
  },
  {
    message: 'Para marcar como pago, informe data e valor do recebimento',
    path: ['dataRecebimento'],
  }
);

export type Atendimento = z.infer<typeof atendimentoSchema>;
export type AtendimentoFormData = z.infer<typeof atendimentoFormSchema>;
