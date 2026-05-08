import { z } from 'zod';

const numeroObrigatorio = (mensagem: string) =>
  z
    .string()
    .trim()
    .min(1, mensagem)
    .refine((value) => !Number.isNaN(Number(value.replace(',', '.'))), mensagem);

export const passo3Schema = z
  .object({
    latitude: numeroObrigatorio('Informe a latitude.'),
    longitude: numeroObrigatorio('Informe a longitude.'),
    areaTotal: numeroObrigatorio('Informe a área total.'),
    arquivoTalhoes: z.string().optional(),
  })
  .refine((data) => {
    const latitude = Number(data.latitude.replace(',', '.'));
    return latitude >= -90 && latitude <= 90;
  }, { path: ['latitude'], message: 'A latitude deve ficar entre -90 e 90.' })
  .refine((data) => {
    const longitude = Number(data.longitude.replace(',', '.'));
    return longitude >= -180 && longitude <= 180;
  }, { path: ['longitude'], message: 'A longitude deve ficar entre -180 e 180.' })
  .refine((data) => Number(data.areaTotal.replace(',', '.')) > 0, {
    path: ['areaTotal'],
    message: 'A área precisa ser maior que zero.',
  });

export type Passo3Schema = z.infer<typeof passo3Schema>;
