'use client';

import { useMemo, useState } from 'react';
import {
  JURIDICA_PRESTADOR_CATEGORIES,
  NATURAL_PRESTADOR_CATEGORIES,
  documentTypeAppliesTo,
  getLiabilityText,
  operatorTypeFromPrestadorTipo,
  type PrestadorTipo,
} from '@/lib/operatorRegistration';

type CityOption = { id: string; name: string; countryId: string | null; countryCode: string | null };
type DocumentTypeOption = {
  id: string;
  countryId: string;
  code: string;
  label: string;
  validationRegex: string | null;
  isRequired: boolean;
};

const PAYMENT_ACCOUNT_LABEL: Record<string, string> = {
  CO: 'Cuenta de pago — Nequi, Daviplata o número bancario (Colombia)',
  BR: 'Chave PIX — celular, CPF ou e-mail (Brasil)',
};

export function OperatorRegisterForm({
  cities,
  documentTypes,
  registerOperator,
}: {
  cities: CityOption[];
  documentTypes: DocumentTypeOption[];
  registerOperator: (formData: FormData) => void;
}) {
  const [prestadorTipo, setPrestadorTipo] = useState<PrestadorTipo>('NATURAL');
  const [cityId, setCityId]               = useState('');
  const [showPassword, setShowPassword]   = useState(false);

  const selectedCity   = useMemo(() => cities.find((c) => c.id === cityId) ?? null, [cities, cityId]);
  const operatorType   = operatorTypeFromPrestadorTipo(prestadorTipo);
  const countryCode    = selectedCity?.countryCode?.toUpperCase() ?? null;

  const relevantDocumentTypes = useMemo(() => {
    if (!selectedCity?.countryId) return [];
    return documentTypes.filter(
      (dt) => dt.countryId === selectedCity.countryId && documentTypeAppliesTo(dt.code, operatorType),
    );
  }, [documentTypes, selectedCity, operatorType]);

  const liabilityText = getLiabilityText(countryCode);
  const categories    = prestadorTipo === 'NATURAL' ? NATURAL_PRESTADOR_CATEGORIES : JURIDICA_PRESTADOR_CATEGORIES;
  const paymentLabel  = countryCode ? (PAYMENT_ACCOUNT_LABEL[countryCode] ?? PAYMENT_ACCOUNT_LABEL.CO) : PAYMENT_ACCOUNT_LABEL.CO;

  return (
    <form action={registerOperator} className="mt-6 space-y-5">
      <input type="hidden" name="prestadorTipo" value={prestadorTipo} />

      {/* ── Tipo de prestador ─────────────────────────── */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">¿Cómo vas a ofrecer tus experiencias?</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPrestadorTipo('NATURAL')}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
              prestadorTipo === 'NATURAL'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="block font-semibold">Persona natural</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Guía, conductor, fotógrafo, instructor, cocinero, artesano…
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPrestadorTipo('JURIDICA')}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
              prestadorTipo === 'JURIDICA'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="block font-semibold">Persona jurídica</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Agencia, operador turístico, transporte, hotel…
            </span>
          </button>
        </div>
      </div>

      {/* ── Categoría ─────────────────────────────────── */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          {prestadorTipo === 'NATURAL' ? '¿Qué tipo de experiencia ofreces?' : '¿Qué tipo de empresa eres?'}
        </label>
        <select name="categoria" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" required>
          <option value="">Selecciona una opción</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400">
          Nos ayuda a mostrarte los documentos correctos y a categorizar tu perfil.
        </p>
      </div>

      {/* ── Datos básicos ─────────────────────────────── */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          {prestadorTipo === 'NATURAL' ? 'Nombre completo' : 'Razón social'}
        </label>
        <input name="name" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" required />
      </div>

      {prestadorTipo === 'JURIDICA' && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Representante legal</label>
          <input name="legalRepresentative" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" required />
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input type="email" name="email" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" required />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">Teléfono / WhatsApp</label>
        <input name="phone" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" required />
      </div>

      {/* ── Contraseña ────────────────────────────────── */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">Contraseña</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            minLength={8}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm pr-20"
            placeholder="Mínimo 8 caracteres"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Con esta contraseña accederás a tu panel de operador.
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">Ciudad donde operas</label>
        <select
          name="cityId"
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          required
        >
          <option value="">Selecciona una ciudad</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Identidad y documentos (aparece al elegir ciudad) ── */}
      {selectedCity && (
        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Identidad y documentos — {selectedCity.name}
          </p>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              {prestadorTipo === 'NATURAL' ? 'Documento de identidad (número)' : 'Documento fiscal (NIT / RUT)'}
            </label>
            <input name="identityDocumentNumber" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" required />
          </div>

          {relevantDocumentTypes.map((dt) => (
            <div key={dt.id} className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                {dt.label}
                {dt.isRequired ? ' *' : ' (opcional)'}
              </label>
              <input
                name={`doc_${dt.id}`}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                required={dt.isRequired}
                pattern={dt.validationRegex ?? undefined}
              />
            </div>
          ))}

          {/* Cuenta de pago */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              {paymentLabel}
            </label>
            <input
              name="paymentAccount"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder={countryCode === 'BR' ? 'celular, CPF o e-mail registrado en PIX' : '+57 300 000 0000 o número de cuenta'}
            />
            <p className="text-xs text-slate-400">
              Aquí recibirás los pagos de NativaGo. Puedes completarlo después si aún no lo tienes.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Documento de soporte (identidad, licencia o registro — PDF o imagen)
            </label>
            <input
              type="file"
              name="licenseDocument"
              accept="application/pdf,image/*"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* ── Términos con modelo de negocio explícito ──── */}
      <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
        <input
          id="liabilityAccepted"
          name="liabilityAccepted"
          type="checkbox"
          className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          required
        />
        <label htmlFor="liabilityAccepted" className="leading-relaxed">
          {liabilityText}
        </label>
      </div>

      <button
        type="submit"
        className="mt-2 w-full rounded bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
      >
        Crear cuenta y enviar para verificación
      </button>
      <p className="text-center text-xs text-slate-400">
        Podrás entrar a tu panel y armar tu primera experiencia en borrador mientras revisamos tu cuenta.
      </p>
    </form>
  );
}
