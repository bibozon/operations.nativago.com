'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Experience = {
  id: number;
  title: string;
  price: number;
  featured: boolean;
  city?: { name: string };
  category?: { name: string; slug: string };
};

type CurrentUser = {
  id: number;
  name: string | null;
  email: string;
  role: 'SUPERADMIN' | 'OPERATOR_AGENCY' | 'OPERATOR_FREELANCE';
  operator?: { id: number; name: string } | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  async function loadExperiences() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/catalog/experiences');
      if (!res.ok) {
        throw new Error('Error cargando experiencias');
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Respuesta inesperada del API');
      }
      setExperiences(data);
    } catch (err) {
      console.error('Admin loadExperiences failed', err);
      setError(err instanceof Error ? err.message : 'Error cargando experiencias');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExperiences();

    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.user) {
          setCurrentUser(data.user as CurrentUser);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta experiencia?')) return;

    try {
      setError(null);
      const res = await fetch('/api/catalog/experience', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, featured: false }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Error actualizando experiencia');
      }

      await loadExperiences();
    } catch (err) {
      console.error('Admin delete (soft) experience failed', err);
      setError(err instanceof Error ? err.message : 'Error actualizando experiencia');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">NativaGo CMS Admin</h1>
            {currentUser && (
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                    currentUser.role === 'SUPERADMIN'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-sky-50 text-sky-700'
                  }`}
                >
                  {currentUser.role}
                </span>
                {currentUser.operator?.name && (
                  <span className="text-slate-500">
                    · {currentUser.operator.name}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
            <Link
              href="/admin/new"
              className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
            >
              New Experience
            </Link>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Category
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  City
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Price
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Featured
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {experiences.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-2 text-sm font-medium text-slate-900">
                    {exp.title}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {exp.category?.name ?? '-'}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {exp.city?.name ?? '-'}
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-slate-900">
                    ${'{'}exp.price.toLocaleString('es-CO'){'}'}
                  </td>
                  <td className="px-4 py-2 text-center text-xs">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${exp.featured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {exp.featured ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-xs">
                    <div className="inline-flex items-center gap-2">
                      {/* Placeholder para futura edición detallada */}
                      <button
                        className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                        type="button"
                      >
                        Set not featured
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {experiences.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No experiences yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
