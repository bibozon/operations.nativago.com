import { TRUST_LEVEL_MAX, type TrustLevelResult } from '@/lib/operatorTrustLevel';

export function TrustLevelCard({ trustLevel }: { trustLevel: TrustLevelResult | null }) {
  if (!trustLevel) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Nivel de confianza</p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-2xl font-semibold text-slate-900">{trustLevel.label}</p>
        <span className="text-xs text-slate-400">
          {trustLevel.level}/{TRUST_LEVEL_MAX}
        </span>
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: TRUST_LEVEL_MAX }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < trustLevel.level ? 'bg-emerald-500' : 'bg-slate-100'}`}
          />
        ))}
      </div>
      {trustLevel.nextLevelHint && <p className="mt-2 text-xs text-slate-500">{trustLevel.nextLevelHint}</p>}
    </div>
  );
}
