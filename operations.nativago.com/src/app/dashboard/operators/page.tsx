import React, { useEffect, useState } from 'react';

interface Operator {
  id: number;
  name: string;
  email: string;
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOperators() {
      try {
        setLoading(true);
        const res = await fetch('/api/operators');
        if (!res.ok) throw new Error('Error al obtener operadores');
        const data = await res.json();
        setOperators(data);
      } catch (err: any) {
        setError(err.message || 'Error');
      } finally {
        setLoading(false);
      }
    }
    fetchOperators();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Operadores</h1>
      {loading ? (
        <div>Cargando...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {operators.map((op) => (
            <li key={op.id} className="py-3 flex flex-col">
              <span className="font-medium text-gray-900">{op.name}</span>
              <span className="text-gray-600 text-sm">{op.email}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
