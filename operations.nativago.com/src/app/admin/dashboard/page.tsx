
import React, { useEffect, useState } from 'react';

type Stats = {
  operators: number;
  experiences: number;
  slots: number;
  published: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <section id="stats" className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Operators</h2>
          <p className="text-3xl font-bold" id="operators-count">
            {loading ? '...' : error ? '!' : stats?.operators ?? '-'}
          </p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Experiences</h2>
          <p className="text-3xl font-bold" id="experiences-count">
            {loading ? '...' : error ? '!' : stats?.experiences ?? '-'}
          </p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Slots</h2>
          <p className="text-3xl font-bold" id="slots-count">
            {loading ? '...' : error ? '!' : stats?.slots ?? '-'}
          </p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Published Experiences</h2>
          <p className="text-3xl font-bold" id="published-count">
            {loading ? '...' : error ? '!' : stats?.published ?? '-'}
          </p>
        </div>
      </section>
      {error && (
        <div className="mt-4 text-red-600">Error: {error}</div>
      )}
    </main>
  );
}
