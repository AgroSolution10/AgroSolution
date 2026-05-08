import { z } from 'zod';

export const culturaSchema = z.enum(['soja', 'milho', 'algodao', 'pecuaria']);

export const passo2Schema = z.object({
  culturas: z.array(culturaSchema).min(1, 'Selecione pelo menos uma atividade.'),
});

export type Passo2Schema = z.infer<typeof passo2Schema>;
