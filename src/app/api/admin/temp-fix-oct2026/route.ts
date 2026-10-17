import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Endpoint temporal de un solo uso (auditoria oct2026, round 5): deja la
// base de datos de PRODUCCION sin ningun dato de prueba, como paso previo
// a separar Preview de Produccion en bases de datos distintas.
//
// A pedido explicito del usuario (confirmado en chat): se borra TODO el
// catalogo actual (operadores + experiencias + sus reservas/resenas/cupos),
// incluido el operador y las 3 experiencias preexistentes de Armacao dos
// Buzios (confirmadas por el usuario como datos de prueba/semilla, no
// clientes reales) -- no solo lo marcado [PRUEBA]. Tambien corrige el
// CountrySlide de Brasil con un path local de Windows como imageUrl
// ("Foz do Iguazu", fuera del piloto).
//
// No se tocan: Category, City, Country (datos de configuracion, no de
// prueba) ni User/Session (por si algun usuario de operador debe
// reutilizarse mas adelante -- quedan huerfanos pero inofensivos).
//
// Protegido por token fijo. Se elimina de este repo en cuanto termine su uso.
const ONE_TIME_TOKEN = 'wZ3mNq7T-pL9vXsB2-rD6kGhY4c';

const BROKEN_HERO_SLIDE_ID = 'cmtuchney000114ispt3zb6or';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const mode = req.nextUrl.searchParams.get('mode') ?? 'plan';

  if (token !== ONE_TIME_TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const [operatorCount, experienceCount, bookingCount, reviewCount, slotCount, availCount, memberCount, docCount] =
    await Promise.all([
      prisma.operator.count(),
      prisma.experience.count(),
      prisma.booking.count(),
      prisma.review.count(),
      prisma.slot.count(),
      prisma.availabilitySlot.count(),
      prisma.operatorMember.count(),
      prisma.operatorDocument.count(),
    ]);

  const operators = await prisma.operator.findMany({
    select: { id: true, name: true, email: true, cityId: true, city: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const brokenSlide = await prisma.countrySlide.findUnique({ where: { id: BROKEN_HERO_SLIDE_ID } });

  if (mode === 'plan') {
    return NextResponse.json({
      mode: 'plan',
      willDeleteEntirely: {
        operators: operatorCount,
        experiences: experienceCount,
        bookings: bookingCount,
        reviews: reviewCount,
        slots: slotCount,
        availabilitySlots: availCount,
        operatorMembers: memberCount,
        operatorDocuments: docCount,
      },
      operatorsList: operators.map((o) => ({ id: o.id, name: o.name, email: o.email, city: o.city?.name })),
      brokenHeroSlide: brokenSlide,
      willNotTouch: ['Category', 'City', 'Country', 'User', 'Session'],
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

    // Limpia la auto-referencia de "referido por" antes de borrar operadores.
    await prisma.operator.updateMany({ data: { referredByOperatorId: null } });

    const reviewsDeleted = await prisma.review.deleteMany({});
    const bookingsDeleted = await prisma.booking.deleteMany({});
    const availDeleted = await prisma.availabilitySlot.deleteMany({});
    const slotsDeleted = await prisma.slot.deleteMany({});
    const experiencesDeleted = await prisma.experience.deleteMany({});
    const membersDeleted = await prisma.operatorMember.deleteMany({});
    const docsDeleted = await prisma.operatorDocument.deleteMany({});
    const operatorsDeleted = await prisma.operator.deleteMany({});

    return NextResponse.json({
      ok: true,
      brokenHeroSlideDeleted: slideDeleted,
      deleted: {
        reviews: reviewsDeleted.count,
        bookings: bookingsDeleted.count,
        availabilitySlots: availDeleted.count,
        slots: slotsDeleted.count,
        experiences: experiencesDeleted.count,
        operatorMembers: membersDeleted.count,
        operatorDocuments: docsDeleted.count,
        operators: operatorsDeleted.count,
      },
      message: 'Base de datos sin catalogo de prueba. Borra este endpoint ahora.',
    });
  }

  return NextResponse.json({ error: 'invalid_mode' }, { status: 400 });
}
