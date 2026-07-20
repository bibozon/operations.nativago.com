export function NewCredentialsBanner({
  email,
  password,
  onDismiss,
}: {
  email: string;
  password: string;
  onDismiss: () => Promise<void>;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
      <p className="text-sm font-semibold text-emerald-800">Cuenta creada para {email}</p>
      <p className="mt-1 text-sm text-emerald-700">
        Contraseña: <code className="rounded bg-white px-2 py-0.5 font-mono text-emerald-900">{password}</code>
      </p>
      <p className="mt-1 text-xs text-emerald-600">
        Cópiala ahora y compártela por un canal seguro — no se vuelve a mostrar.
      </p>
      <form action={onDismiss} className="mt-2">
        <button type="submit" className="text-xs font-medium text-emerald-700 hover:underline">
          Entendido, ocultar
        </button>
      </form>
    </div>
  );
}
