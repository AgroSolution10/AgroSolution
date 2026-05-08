import { z } from 'zod';
import { isCpfOuCnpj } from '@/utils/validators';

export const passo1Schema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome completo.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
  cpfCnpj: z.string().refine(isCpfOuCnpj, 'CPF ou CNPJ inválido.'),
  senha: z.string().min(8, 'Use pelo menos 8 caracteres.'),
});

export type Passo1Schema = z.infer<typeof passo1Schema>;
