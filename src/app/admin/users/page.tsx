import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { requireSuperadmin } from '@/lib/requireRole';
import { generateTempPassword, setFlashCredentials, readFlashCredentials, clearFlashCredentials } from '@/lib/generatePassword';
import { NewCredentialsBanner } from '@/components/admin/NewCredentialsBanner';

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100';
const labelClass = 'block text-xs font-medium text-slate-600';

export default async function UsersPage() {
  await requireSuperadmin();

  const users = await prisma.user.findMany({
    where: { role: 'SUPPORT' },
    orderBy: { createdAt: 'asc' },
  });

  const flash = await readFlashCredentials();

  async function addSupportUser(formData: FormData) {
    'use server';

    await requireSuperadmin();

    const name = ((formData.get('name') as string) ?? '').trim();
    const email = ((formData.get('email') as string) ?? '').trim().toLowerCase();
    if (!name || !email) return;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return;

    const password = generateTempPassword();
    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: { name, email, password: hashed, role: 'SUPPORT' },
    });

    await setFlashCredentials(email, password);
    redirect('/admin/users');
  }

  async function regeneratePassword(formData: FormData) {
    'use server';

    await requireSuperadmin();

    const userId = Number(formData.get('userId'));
    if (!Number.isFinite(userId)) return;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, role: true } });
    if (!user || user.role !== 'SUPPORT') return;

    const password = generateTempPassword();
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    await setFlashCredentials(user.email, password);
    redirect('/admin/users');
  }

  async function dismissCredentials() {
    'use server';
    await clearFlashCredentials();
    redirect('/admin/users');
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Usuarios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cuentas de Soporte con acceso operativo al CMS (sin Configuración, Categorías ni Ciudades).
        </p>
      </header>

      {flash && (
        <NewCredentialsBanner email={flash.email} password={flash.password} onDismiss={dismissCredentials} />
      )}

      <form action={addSupportUser} className="mb-6 flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex-1 min-w-[160px]">
          <label className={labelClass}>Nombre</label>
          <input name="name" placeholder="Nombre completo" className={inputClass} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className={labelClass}>Email</label>
          <input name="email" type="email" placeholder="correo@ejemplo.com" className={inputClass} />
        </div>
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
        >
          Crear usuario de soporte
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                  <td className="px-4 py-2.5 text-right">
                    <form action={regeneratePassword} className="inline">
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" className="text-xs font-medium text-teal-700 hover:underline">
                        Regenerar contraseña
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                    No hay usuarios de soporte todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
