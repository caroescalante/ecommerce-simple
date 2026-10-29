import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(200),
});

export const productSchema = z.object({
  descripcion: z.string().trim().min(2, 'La descripción es muy corta').max(1000, 'La descripción es muy larga'),
  precio: z
    .number('El precio debe ser un número')
    .min(0, 'El precio no puede ser negativo')
    .max(99999999.99, 'El precio es demasiado alto')
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'El precio admite hasta 2 decimales'),
  categoriaId: z.number('Elegí una categoría').int().positive('Elegí una categoría'),
  imagenUrl: z
    .string()
    .trim()
    .max(500)
    .regex(/^(\/img\/productos\/[\w.-]+|https?:\/\/\S+)$/, 'Imagen inválida')
    .nullable()
    .optional()
    .transform((v) => v || null),
});
