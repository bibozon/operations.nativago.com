import { getTranslations } from "next-intl/server";

export default async function OperatorExperiences({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t("nav.experiences")}</h2>
      <p className="text-sm text-slate-600">Listado y creación de experiencias (pendiente de conectar a API).</p>
    </div>
  );
}
