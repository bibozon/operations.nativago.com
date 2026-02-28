import React, { useEffect, useState } from 'react';

interface Booking {
  id: number;
  travelerName: string;
  seats: number;
  status: string;
  experience: { id: number; title: string };
  slot: { id: number; date: string; time: string };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const res = await fetch('/api/bookings');
        if (!res.ok) throw new Error('Error al obtener reservas');
        const data = await res.json();
        setBookings(data);
      } catch (err: any) {
        setError(err.message || 'Error');
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Reservas</h1>
      {loading ? (
        <div>Cargando...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Viajero</th>
              <th className="px-4 py-2 text-left">Experiencia</th>
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Seats</th>
              <th className="px-4 py-2 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-4 py-2">{b.travelerName}</td>
                <td className="px-4 py-2">{b.experience?.title ?? '-'}</td>
                <td className="px-4 py-2">{b.slot?.date ?? '-'}</td>
                <td className="px-4 py-2">{b.seats}</td>
                <td className="px-4 py-2">{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
