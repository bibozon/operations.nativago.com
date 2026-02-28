import prisma from '@/lib/db';
import { requireAuth } from '@/lib/requireRole';
import { redirect } from 'next/navigation';

export default async function OperatorAgreementAcceptPage() {
  const auth = await requireAuth();

  const operator = await prisma.operator.findFirst({
    where: { userId: auth.userId },
    select: { id: true, contractAccepted: true },
  });

  if (!operator) {
    redirect('/register/operator');
  }

  if (operator.contractAccepted) {
    redirect('/admin');
  }

  async function acceptAgreement() {
    'use server';

    const authInAction = await requireAuth();

    const op = await prisma.operator.findFirst({
      where: { userId: authInAction.userId },
      select: { id: true },
    });

    if (!op) {
      redirect('/register/operator');
    }

    await prisma.operator.update({
      where: { id: op.id },
      data: {
        contractAccepted: true,
        contractAcceptedAt: new Date(),
      },
    });

    redirect('/admin');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Aceite do Contrato de Intermediação — Operadores NativaGo
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Resumo do contrato: a NativaGo atua como intermediadora digital de
          reservas (sem executar diretamente os serviços turísticos), enquanto
          o operador é responsável pela execução das atividades, cumprindo as
          obrigações legais, de segurança, cancelamento e veracidade das
          informações.
        </p>

        <div className="mt-4 text-sm text-slate-700">
          <p>
            Para ler o contrato completo, acesse
            {' '}
            <a
              href="/legal/operador"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-emerald-700 underline hover:text-emerald-600"
            >
              /legal/operador
            </a>
            .
          </p>
        </div>

        <form action={acceptAgreement} className="mt-6 space-y-4">
          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              name="accept"
              required
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>
              Declaro que li e aceito o Contrato de Intermediação NativaGo.
            </span>
          </label>

          <button
            type="submit"
            className="ml-auto rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Aceitar contrato
          </button>
        </form>
      </div>
    </div>
  );
}
