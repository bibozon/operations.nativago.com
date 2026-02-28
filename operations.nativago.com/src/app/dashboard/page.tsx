import { db } from '@/lib/db';

export default async function DashboardPage() {
  const [operatorCount, experienceCount, publishedCount, futureSlotsCount] = await Promise.all([
    db.operator.count(),
    db.experience.count(),
    db.experience.count({ where: { status: 'PUBLISHED' } }),
    db.slot.count({ where: { date: { gte: new Date().toISOString().slice(0, 10) } } }),
  ]);

  // Métricas de negocio
  const totalBookings = await db.booking.count();
  const confirmedBookings = await db.booking.count({ where: { status: 'CONFIRMED' } });
  const seatsSoldAgg = await db.booking.aggregate({
    _sum: { seats: true },
    where: { status: 'CONFIRMED' },
  });
  const seatsSold = seatsSoldAgg._sum.seats || 0;

  // Calcular revenue estimado (seats * price * 0.15)
  const confirmed = await db.booking.findMany({
    where: { status: 'CONFIRMED' },
    include: { experience: { select: { price: true } } },
  });
  const estimatedRevenue = confirmed.reduce((sum, b) => sum + (b.seats * (b.experience?.price ?? 0) * 0.15), 0);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Operadores</h2>
          <p className="text-3xl font-bold">{operatorCount}</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Experiencias</h2>
          <p className="text-3xl font-bold">{experienceCount}</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Publicadas</h2>
          <p className="text-3xl font-bold">{publishedCount}</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Slots futuros</h2>
          <p className="text-3xl font-bold">{futureSlotsCount}</p>
        </div>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Total reservas</h2>
          <p className="text-3xl font-bold">{totalBookings}</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Reservas confirmadas</h2>
          <p className="text-3xl font-bold">{confirmedBookings}</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Asientos vendidos</h2>
          <p className="text-3xl font-bold">{seatsSold}</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Revenue estimado</h2>
          <p className="text-3xl font-bold">${estimatedRevenue.toFixed(2)}</p>
        </div>
      </section>
    </main>
  );
}
