import React, { useEffect, useState } from 'react';

interface Experience {
  id: number;
  title: string;
}
interface Slot {
  id: number;
  date: string;
  time: string;
  capacity: number;
}

export default function SlotsCalendarPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedExp, setSelectedExp] = useState<string>('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchExperiences() {
      const res = await fetch('/api/experiences');
      if (res.ok) {
        const data = await res.json();
        setExperiences(data);
      }
    }
    fetchExperiences();
  }, []);

  useEffect(() => {
    async function fetchSlots() {
      if (!selectedExp) return setSlots([]);
      setLoading(true);
      const res = await fetch(`/api/slots?experienceId=${selectedExp}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
      setLoading(false);
    }
    fetchSlots();
  }, [selectedExp]);

  // Agrupar slots por fecha
  const slotsByDate: Record<string, Slot[]> = {};
  slots.forEach(slot => {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
    slotsByDate[slot.date].push(slot);
  });

  const dates = Object.keys(slotsByDate).sort();

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Calendario de Slots</h1>
      <div className="mb-6">
        <label className="block mb-1 font-medium">Experiencia</label>
        <select className="w-full border rounded px-3 py-2" value={selectedExp} onChange={e => setSelectedExp(e.target.value)}>
          <option value="">Selecciona una experiencia</option>
          {experiences.map(exp => (
            <option key={exp.id} value={exp.id}>{exp.title}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div>Cargando...</div>
      ) : selectedExp && (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Hora</th>
              <th className="px-4 py-2 text-left">Capacidad</th>
            </tr>
          </thead>
          <tbody>
            {dates.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-2 text-center">Sin slots</td></tr>
            ) : dates.map(date => (
              slotsByDate[date].map(slot => (
                <tr key={slot.id} className="border-t">
                  <td className="px-4 py-2">{slot.date}</td>
                  <td className="px-4 py-2">{slot.time}</td>
                  <td className="px-4 py-2">{slot.capacity}</td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
