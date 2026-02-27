import { getTranslations } from "next-intl/server";

export default async function StartActivityPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t("nav.startActivity")}</h2>
      <p className="text-sm text-slate-600">Escáner QR e inicio de actividad (UI pendiente).</p>
    </div>
  );
}
