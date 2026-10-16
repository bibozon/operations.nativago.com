import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Endpoint temporal de un solo uso (auditoria oct2026, round 4): corrige dos
// problemas detectados por el diagnostico anterior:
//  1) Un CountrySlide tipo HERO para Brasil con un path local de Windows
//     como imageUrl (dato invalido, ciudad "Foz do Iguazu" fuera del piloto)
//     que estaba tapando el fallback correcto del hero del Marketplace.
//  2) El endpoint de catalogo (temp-brazil-catalog-oct2026) se ejecuto dos
//     veces -- cada uno de los 6 operadores [PRUEBA] quedo con 90
//     actividades en vez de 45 (titulos duplicados exactos). Este endpoint
//     deja solo 1 copia de cada titulo por operador.
// Protegido por token fijo. Se elimina de este repo en cuanto termine su uso.
const ONE_TIME_TOKEN = 'dK8vQnR3-xL6mWtY2-pJ9cHzUb4e';

const OPERATOR_IDS = [
  'cmvadp0vn00017sdt2pimqsor', // Operador de prueba Cabo Frio
  'cmvaf45br0001w968ufheky6d', // Operador 2 de Cabo Frio
  'cmvadp13800057sdttamdtc5u', // Operador de prueba Arraial do Cabo
  'cmvaf45u3002lw968nyu7cfgr', // Operador 2 de Arraial do Cabo
  'cmru68wzk009ikf7g0og2uxiu', // Búzios Transportes Turísticos Ltda
  'cmvaf468x0055w968pmta2ho7', // Operador 2 de Armação dos Búzios
];

const BROKEN_HERO_SLIDE_ID = 'cmtuchney000114ispt3zb6or';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const mode = req.nextUrl.searchParams.get('mode') ?? 'plan';

  if (token !== ONE_TIME_TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Agrupa las experiencias de los 6 operadores por (operatorId, title) para
  // encontrar duplicados exactos.
  const experiences = await prisma.experience.findMany({
    where: { operatorId: { in: OPERATOR_IDS } },
    select: { id: true, title: true, operatorId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const groups = new Map<string, typeof experiences>();
  for (const exp of experiences) {
    const key = `${exp.operatorId}__${exp.title}`;
    const arr = groups.get(key) ?? [];
    arr.push(exp);
    groups.set(key, arr);
  }

  const duplicateGroups = [...groups.entries()].filter(([, arr]) => arr.length > 1);
  const idsToDelete = duplicateGroups.flatMap(([, arr]) => arr.slice(1).map((e) => e.id)); // conserva el mas antiguo (idx 0)

  const brokenSlide = await prisma.countrySlide.findUnique({ where: { id: BROKEN_HERO_SLIDE_ID } });

  if (mode === 'plan') {
    return NextResponse.json({
      mode: 'plan',
      totalExperiencesForThese6Operators: experiences.length,
      duplicateTitleGroups: duplicateGroups.length,
      experiencesToDelete: idsToDelete.length,
      expectedAfterCleanupPerOperator: 'deberia quedar como maximo 1 experiencia seed vieja + 45 de categorias por operador',
      brokenHeroSlide: brokenSlide,
      note: 'Esto es solo un plan (no se borro ni cambio nada). Llama con &mode=apply&confirm=YES para ejecutar.',
    });
  }

  if (mode === 'apply') {
    const confirm = req.nextUrl.searchParams.get('confirm');
    if (confirm !== 'YES') {
      return NextResponse.json({ error: 'missing_confirm', hint: 'agrega &confirm=YES' }, { status: 400 });
    }

    let slideDeleted = false;
    if (brokenSlide) {
      await prisma.countrySlide.delete({ where: { id: BROKEN_HERO_SLIDE_ID } });
      slideDeleted = true;
    }

    const reviewsDeleted = await prisma.review.deleteMany({ where: { experienceId: { in: idsToDelete } } });
    const bookingsDeleted = await prisma.booking.deleteMany({ where: { experienceId: { in: idsToDelete } } });
    const availDeleted = await prisma.availabilitySlot.deleteMany({ where: { experienceId: { in: idsToDelete } } });
    const slotsDeleted = await prisma.slot.deleteMany({ where: { experienceId: { in: idsToDelete } } });
    const expDeleted = await prisma.experience.deleteMany({ where: { id: { in: idsToDelete } } });

    return NextResponse.json({
      ok: true,
      brokenHeroSlideDeleted: slideDeleted,
      duplicateExperiencesDeleted: expDeleted.count,
      relatedRowsDeleted: {
        reviews: reviewsDeleted.count,
        bookings: bookingsDeleted.count,
        availability: availDeleted.count,
        slots: slotsDeleted.count,
      },
      message: 'Listo. Borra este endpoint ahora.',
    });
  }

  return NextResponse.json({ error: 'invalid_mode' }, { status: 400 });
}
