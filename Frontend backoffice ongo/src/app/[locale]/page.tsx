import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { LocaleSwitcher } from "@/presentation/components/LocaleSwitcher";

export default async function LocaleHome({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <h1 className="text-lg font-semibold">operations.nativago.com</h1>
        <LocaleSwitcher />
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6">
        <nav className="flex gap-3 text-sm font-medium">
          <Link href={`/${params.locale}/dashboard`} className="text-primary hover:underline">
            {t("nav.dashboard")}
          </Link>
          <Link href={`/${params.locale}/experiences`} className="text-primary hover:underline">
            {t("nav.experiences")}
          </Link>
          <Link href={`/${params.locale}/bookings`} className="text-primary hover:underline">
            {t("nav.bookings")}
          </Link>
        </nav>
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-slate-700">
            {t("experience.amountToCollect")}
          </p>
        </section>
      </main>
    </div>
  );
}
