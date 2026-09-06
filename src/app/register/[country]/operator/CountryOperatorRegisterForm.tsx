'use client';

import { useFormState } from 'react-dom';
import { useMemo, useState } from 'react';
import { operatorTypeFromPrestadorTipo, type PrestadorTipo } from '@/lib/operatorRegistration';
import { documentTypeAppliesToOperator, type RegisterI18n } from '@/lib/registerI18n';
import { getLiabilityText } from '@/lib/operatorRegistration';
import type { RegisterState } from '../../operator/actions';

type CityOption = { id: string; name: string; countryId: string | null; countryCode: string | null };
type DocumentTypeOption = {
  id: string;
  countryId: string;
  code: string;
  label: string;
  validationRegex: string | null;
  isRequired: boolean;
};

interface Props {
  i18n: RegisterI18n;
  cities: CityOption[];
  documentTypes: DocumentTypeOption[];
  registerOperator: (prevState: RegisterState, formData: FormData) => Promise<RegisterState>;
}

export function CountryOperatorRegisterForm({ i18n, cities, documentTypes, registerOperator }: Props) {
  const [state, formAction] = useFormState(registerOperator, null);

  const [prestadorTipo, setPrestadorTipo] = useState<PrestadorTipo>('NATURAL');
  const [cityId, setCityId]               = useState('');
  const [showPassword, setShowPassword]   = useState(false);

  const selectedCity  = useMemo(() => cities.find((c) => c.id === cityId) ?? null, [cities, cityId]);
  const operatorType  = operatorTypeFromPrestadorTipo(prestadorTipo);

  const relevantDocumentTypes = useMemo(() => {
    if (!selectedCity?.countryId) return [];
    return documentTypes.filter(
      (dt) => dt.countryId === selectedCity.countryId && documentTypeAppliesToOperator(dt.code, operatorType),
    );
  }, [documentTypes, selectedCity, operatorType]);

  const liabilityText = getLiabilityText(i18n.countryCode);
  const categories    = prestadorTipo === 'NATURAL' ? i18n.naturalCategories : i18n.juridicaCategories;

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <input type="hidden" name="prestadorTipo" value={prestadorTipo} />
      <input type="hidden" name="lang" value={i18n.lang} />

      {/* Error global */}
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Tipo de prestador */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">{i18n.sectionType}</label>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { tipo: 'NATURAL' as PrestadorTipo, label: i18n.optNatural, desc: i18n.optNaturalDesc },
              { tipo: 'JURIDICA' as PrestadorTipo, label: i18n.optJuridica, desc: i18n.optJuridicaDesc },
            ] as const
          ).map(({ tipo, label, desc }) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setPrestadorTipo(tipo)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                prestadorTipo === tipo
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="block font-semibold">{label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Categoría */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          {prestadorTipo === 'NATURAL' ? i18n.labelCategoryNatural : i18n.labelCategoryJuridica}
        </label>
        <select name="categoria" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" required>
          <option value="">{i18n.selectOption}</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <p className="text-xs text-slate-400">{i18n.hintCategory}</p>
      </div>

      {/* Nombre / Razón social */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          {prestadorTipo === 'NATURAL' ? i18n.labelNameNatural : i18n.labelNameJuridica}
        </label>
        <input name="name" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" required />
      </div>

      {/* Representante legal (solo JURIDICA) */}
      {prestadorTipo === 'JURIDICA' && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">{i18n.labelLegalRep}</label>
          <input name="legalRepresentative" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" required />
        </div>
      )}

      {/* Email */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">{i18n.labelEmail}</label>
        <input type="email" name="email" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" required />
      </div>

      {/* Teléfono */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">{i18n.labelPhone}</label>
        <input name="phone" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" required />
      </div>

      {/* Contraseña */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">{i18n.labelPassword}</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            minLength={8}
            className="w-full rounded border border-slate-200 px-3 py-2 pr-20 text-sm"
            placeholder={i18n.placeholderPassword}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            {showPassword ? i18n.hidePassword : i18n.showPassword}
          </button>
        </div>
        <p className="text-xs text-slate-400">{i18n.hintPassword}</p>
      </div>

      {/* Ciudad */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">{i18n.labelCity}</label>
        <select
          name="cityId"
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          required
        >
          <option value="">{i18n.selectCity}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Identidad y documentos — visible al elegir ciudad */}
      {selectedCity && (
        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {i18n.sectionIdentity} — {selectedCity.name}
          </p>

          {/* Número de identidad principal */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              {prestadorTipo === 'NATURAL' ? i18n.labelIdentityNatural : i18n.labelIdentityJuridica}
            </label>
            <input name="identityDocumentNumber" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" required />
          </div>

          {/* Documentos dinámicos del país */}
          {relevantDocumentTypes.map((dt) => (
            <div key={dt.id} className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                {dt.label}
                {dt.isRequired ? ' *' : ` ${i18n.optional}`}
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
            <label className="block text-sm font-medium text-slate-700">{i18n.labelPayment}</label>
            <input
              name="paymentAccount"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder={i18n.placeholderPayment}
            />
            <p className="text-xs text-slate-400">{i18n.hintPayment}</p>
          </div>

          {/* Documento de soporte */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">{i18n.labelDocument}</label>
            <input
              type="file"
              name="licenseDocument"
              accept="application/pdf,image/*"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* Declaración de responsabilidad */}
      <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
        <input
          id="liabilityAccepted"
          name="liabilityAccepted"
          type="checkbox"
          className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          required
        />
        <label htmlFor="liabilityAccepted" className="leading-relaxed">{liabilityText}</label>
      </div>

      <button
        type="submit"
        className="mt-2 w-full rounded bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
      >
        {i18n.submitBtn}
      </button>
      <p className="text-center text-xs text-slate-400">{i18n.hintAfterSubmit}</p>
    </form>
  );
}
