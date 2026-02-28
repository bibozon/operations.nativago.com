import React, { useEffect, useState } from 'react';

interface Experience {
  id: number;
  title: string;
  price: number;
  operator: { id: number; name: string };
  images?: string[];
  status?: string;
}

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExperiences() {
      try {
        setLoading(true);
        const res = await fetch('/api/experiences');
        if (!res.ok) throw new Error('Error al obtener experiencias');
        const data = await res.json();
        setExperiences(data);
      } catch (err: any) {
        setError(err.message || 'Error');
      } finally {
        setLoading(false);
      }
    }
    fetchExperiences();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Experiencias</h1>
      {loading ? (
        <div>Cargando...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiences.map((exp) => (
            <div key={exp.id} className="bg-white rounded shadow p-4 flex flex-col items-center">
              {exp.images && exp.images.length > 0 ? (
                <img src={exp.images[0]} alt={exp.title} className="h-32 w-32 object-cover rounded mb-2" />
              ) : (
                <div className="h-32 w-32 bg-gray-200 flex items-center justify-center rounded mb-2 text-gray-500">Sin imagen</div>
              )}
              <span className="font-medium text-gray-900 text-lg mb-1">{exp.title}</span>
              <span className="text-gray-600 text-sm mb-1">Operador: {exp.operator?.name ?? '-'}</span>
              <span className="text-gray-600 text-sm mb-1">Precio: ${exp.price}</span>
              <span className="text-gray-600 text-sm">Estado: {exp.status ?? 'DRAFT'}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
