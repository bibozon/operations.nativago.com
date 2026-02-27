import prisma from '@/lib/db';
import { requireAuth } from '@/lib/requireRole';
import { redirect } from 'next/navigation';

export default async function OperatorTermsPage() {
  const auth = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { operatorTermsAccepted: true },
  });

  if (user?.operatorTermsAccepted) {
    redirect('/admin');
  }

  async function acceptTerms() {
    'use server';

    const authInAction = await requireAuth();

    await prisma.user.update({
      where: { id: authInAction.userId },
      data: {
        operatorTermsAccepted: true,
        operatorTermsAcceptedAt: new Date(),
      },
    });

    redirect('/admin');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Termos para Operadores NativaGo
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Leia atentamente os termos abaixo antes de publicar experiências na
          NativaGo.
        </p>

        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <p>- NativaGo é apenas plataforma de intermediação.</p>
          <p>- O operador é responsável pela execução do serviço turístico.</p>
          <p>- O operador deve possuir todas as licenças, registros (incluindo CADASTUR quando aplicável) e seguros exigidos pela legislação.</p>
          <p>- Os pagamentos restantes (após o sinal de 15%) são feitos diretamente ao operador no dia da atividade.</p>
          <p>- NativaGo não participa da operação turística nem acompanha a execução do serviço.</p>
          <p>- A responsabilidade civil pela experiência prestada é exclusivamente do operador.</p>
        </div>

        <form action={acceptTerms} className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Aceito os termos
          </button>
        </form>
      </div>
    </div>
  );
}
