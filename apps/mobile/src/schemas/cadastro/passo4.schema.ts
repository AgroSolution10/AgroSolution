import { z } from 'zod';

export const passo4Schema = z.object({
  aceiteTermos: z.literal(true, {
    errorMap: () => ({ message: 'Você precisa aceitar os Termos de Uso.' }),
  }),
  aceitePrivacidade: z.literal(true, {
    errorMap: () => ({ message: 'Você precisa aceitar a Política de Privacidade (LGPD).' }),
  }),
});

export type Passo4Schema = z.infer<typeof passo4Schema>;
