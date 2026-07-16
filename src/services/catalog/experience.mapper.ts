// Este archivo quedó como shim de compatibilidad: el tipo del dominio vive
// en src/domain/entities/Experience.ts y el mapeo Prisma→DTO en
// src/infrastructure/persistence/prisma/mappers/experienceMapper.ts. Se
// re-exportan desde acá para no romper los imports existentes
// (`from './experience.mapper'`) en el resto del código.
export type { ExperienceCardDTO } from '@/domain/entities/Experience';
export {
  mapExperienceToCard,
  mapExperiencesToCards,
  type PrismaExperienceForCard,
} from '@/infrastructure/persistence/prisma/mappers/experienceMapper';
