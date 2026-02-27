import { getTranslations } from "next-intl/server";

export default async function OperatorDashboard({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t("nav.dashboard")}</h2>
      <p className="text-sm text-slate-600">Backoffice NativaGo - operador.</p>
    </div>
  );
}
