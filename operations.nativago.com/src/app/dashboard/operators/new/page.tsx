import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewOperatorPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', type: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al crear operador');
      router.push('/dashboard/operators');
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nuevo Operador</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1 font-medium">Nombre</label>
          <input className="w-full border rounded px-3 py-2" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Tipo</label>
          <input className="w-full border rounded px-3 py-2" required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input className="w-full border rounded px-3 py-2" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Teléfono</label>
          <input className="w-full border rounded px-3 py-2" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button className="bg-green-600 text-white px-4 py-2 rounded" type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear operador'}
        </button>
      </form>
    </main>
  );
}
