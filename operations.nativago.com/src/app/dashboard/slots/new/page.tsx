import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Experience {
  id: number;
  title: string;
}

export default function NewSlotPage() {
  const router = useRouter();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [form, setForm] = useState({ experienceId: '', date: '', time: '', capacity: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          experienceId: Number(form.experienceId),
          capacity: Number(form.capacity),
        }),
      });
      if (!res.ok) throw new Error('Error al crear slot');
      router.push('/dashboard/experiences');
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nuevo Slot</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1 font-medium">Experiencia</label>
          <select className="w-full border rounded px-3 py-2" required value={form.experienceId} onChange={e => setForm(f => ({ ...f, experienceId: e.target.value }))}>
            <option value="">Selecciona una experiencia</option>
            {experiences.map(exp => (
              <option key={exp.id} value={exp.id}>{exp.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Fecha</label>
          <input className="w-full border rounded px-3 py-2" type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Hora</label>
          <input className="w-full border rounded px-3 py-2" type="time" required value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Capacidad</label>
          <input className="w-full border rounded px-3 py-2" type="number" required value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear slot'}
        </button>
      </form>
    </main>
  );
}
