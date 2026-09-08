'use client';

import { useMemo, useState } from 'react';
import { FormInput } from './FormInput';
import { FormSelect } from './FormSelect';
import { FormFileInput } from './FormFileInput';
import {
  COUNTRY_LABELS,
  OPERATOR_KIND_LABELS,
  getLegalFieldConfig,
} from '@/lib/operatorOnboarding/legalFieldsConfig';
import {
  createEmptyOperatorFormState,
  type OnboardingCountry,
  type OperatorFormErrors,
  type OperatorFormState,
  type OperatorKind,
} from '@/lib/operatorOnboarding/types';

const COUNTRY_OPTIONS = (Object.keys(COUNTRY_LABELS) as OnboardingCountry[]).map((code) => ({
  value: code,
  label: COUNTRY_LABELS[code],
}));

const OPERATOR_KIND_OPTIONS = (Object.keys(OPERATOR_KIND_LABELS) as OperatorKind[]).map((kind) => ({
  value: kind,
  label: OPERATOR_KIND_LABELS[kind],
}));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export function OperatorOnboardingForm() {
  const [form, setForm] = useState<OperatorFormState>(createEmptyOperatorFormState());
  const [errors, setErrors] = useState<OperatorFormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  const legalConfig = useMemo(
    () => getLegalFieldConfig(form.country, form.operatorKind),
    [form.country, form.operatorKind],
  );

  function updateField<K extends keyof OperatorFormState>(key: K, value: OperatorFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleCountryChange(country: string) {
    // Cambiar de país invalida los campos legales del país anterior — se
    // limpian para no enviar, por ejemplo, un NIT colombiano etiquetado
    // como CNPJ brasileño.
    setForm((prev) => ({
      ...prev,
      country: country as OnboardingCountry,
      taxId: '',
      tourismLicense: '',
      professionalCredentialNumber: '',
      legalDocument: null,
    }));
    setErrors({});
  }

  function handleKindChange(kind: string) {
    setForm((prev) => ({
      ...prev,
      operatorKind: kind as OperatorKind,
      taxId: '',
      tourismLicense: '',
      professionalCredentialNumber: '',
      legalDocument: null,
    }));
    setErrors({});
  }

  function validate(): boolean {
    const next: OperatorFormErrors = {};

    if (!form.legalName.trim()) next.legalName = 'Campo obligatorio.';
    if (!form.email.trim()) next.email = 'Campo obligatorio.';
    else if (!EMAIL_RE.test(form.email)) next.email = 'Email inválido.';
    if (!form.phone.trim()) next.phone = 'Campo obligatorio.';
    if (!form.taxId.trim()) next.taxId = 'Campo obligatorio.';
    if (!form.tourismLicense.trim()) next.tourismLicense = 'Campo obligatorio.';
    if (legalConfig.professionalCredentialLabel && !form.professionalCredentialNumber?.trim()) {
      next.professionalCredentialNumber = 'Campo obligatorio.';
    }
    if (!form.legalDocument) next.legalDocument = 'Adjunta el documento requerido.';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setStatus('submitting');

    try {
      const payload = new FormData();
      payload.set('operatorKind', form.operatorKind);
      payload.set('country', form.country);
      payload.set('legalName', form.legalName);
      payload.set('email', form.email);
      payload.set('phone', form.phone);
      payload.set('taxId', form.taxId);
      payload.set('tourismLicense', form.tourismLicense);
      if (form.professionalCredentialNumber) {
        payload.set('professionalCredentialNumber', form.professionalCredentialNumber);
      }
      if (form.legalDocument) {
        payload.set('legalDocument', form.legalDocument);
      }

      const res = await fetch('/api/auth/register-operator', {
        method: 'POST',
        body: payload,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'No se pudo completar el registro.');
      }

      setStatus('success');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo completar el registro.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-8 text-center">
        <h2 className="text-lg font-semibold text-emerald-900">¡Registro enviado!</h2>
        <p className="mt-2 text-sm text-emerald-700">
          Revisaremos tu información y te avisaremos por email cuando tu cuenta esté verificada.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
    >
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Registro de operador</h1>
        <p className="mt-1 text-sm text-slate-500">
          Contanos quién sos y dónde operás — los campos legales cambian según tu país.
        </p>
      </div>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Tipo de operador */}
      <div className="grid grid-cols-2 gap-3">
        {OPERATOR_KIND_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleKindChange(opt.value)}
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
              form.operatorKind === opt.value
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <FormSelect
        label="País de operación"
        name="country"
        value={form.country}
        onChange={handleCountryChange}
        options={COUNTRY_OPTIONS}
      />

      <FormInput
        label={form.operatorKind === 'EMPRESA' ? 'Razón social' : 'Nombre completo'}
        name="legalName"
        value={form.legalName}
        onChange={(v) => updateField('legalName', v)}
        error={errors.legalName}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(v) => updateField('email', v)}
          error={errors.email}
        />
        <FormInput
          label="Teléfono / WhatsApp"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={(v) => updateField('phone', v)}
          error={errors.phone}
        />
      </div>

      {/* Bloque legal — 100% dinámico según país + tipo */}
      <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Identificación legal — {COUNTRY_LABELS[form.country]}
        </p>

        <FormInput
          label={legalConfig.taxIdLabel}
          name="taxId"
          value={form.taxId}
          onChange={(v) => updateField('taxId', v)}
          placeholder={legalConfig.taxIdPlaceholder}
          error={errors.taxId}
        />

        <FormInput
          label={legalConfig.tourismLicenseLabel}
          name="tourismLicense"
          value={form.tourismLicense}
          onChange={(v) => updateField('tourismLicense', v)}
          placeholder={legalConfig.tourismLicensePlaceholder}
          error={errors.tourismLicense}
        />

        {legalConfig.professionalCredentialLabel && (
          <FormInput
            label={legalConfig.professionalCredentialLabel}
            name="professionalCredentialNumber"
            value={form.professionalCredentialNumber ?? ''}
            onChange={(v) => updateField('professionalCredentialNumber', v)}
            placeholder={legalConfig.professionalCredentialPlaceholder}
            error={errors.professionalCredentialNumber}
          />
        )}

        <FormFileInput
          label={legalConfig.legalDocumentLabel}
          name="legalDocument"
          file={form.legalDocument}
          onChange={(file) => updateField('legalDocument', file)}
          error={errors.legalDocument}
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? 'Enviando…' : 'Crear cuenta y enviar para verificación'}
      </button>
    </form>
  );
}
