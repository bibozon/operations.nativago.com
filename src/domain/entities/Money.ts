// Value object de dinero. Fase 0/1 solo lo usa para llevar el código de
// moneda (reemplaza el `currency: 'brl'` fijo del checkout). La conversión
// completa de precios a unidades mínimas (centavos) es trabajo de Fase 4
// ("Money reemplaza Float/Int sueltos") — no se toca aquí para no ampliar
// el radio de este cambio.
export type Money = {
  amount: number;
  currencyCode: string;
};

export function formatMoney(money: Money, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currencyCode,
  }).format(money.amount);
}

// Locale por defecto por moneda — solo para formateo consistente en SSR
// cuando no se tiene explícitamente el locale del país (p.ej. listados de
// SUPERADMIN que mezclan varios países). Si se conoce el locale real del
// país (idioma + código ISO), preferir pasarlo directo a formatMoney.
const DEFAULT_LOCALE_BY_CURRENCY: Record<string, string> = {
  COP: 'es-CO',
  BRL: 'pt-BR',
  USD: 'en-US',
  MXN: 'es-MX',
  CLP: 'es-CL',
  PEN: 'es-PE',
};

export function formatPrice(amount: number, currencyCode: string): string {
  const locale = DEFAULT_LOCALE_BY_CURRENCY[currencyCode] ?? 'es-CO';
  return formatMoney({ amount, currencyCode }, locale);
}
