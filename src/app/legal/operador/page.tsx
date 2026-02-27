export default function OperatorAgreementPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Contrato de Intermediação — Operadores NativaGo
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Este contrato descreve as condições de intermediação entre a NativaGo
          e os operadores turísticos cadastrados na plataforma, válido para
          operações no Brasil.
        </p>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-800">
          <section>
            <h2 className="text-base font-semibold text-slate-900">
              1. Natureza da relação
            </h2>
            <p className="mt-1">
              A NativaGo atua como intermediadora digital de reservas, conectando
              usuários interessados em experiências turísticas a operadores
              devidamente cadastrados. A NativaGo não executa os serviços
              turísticos, nem participa diretamente da operação das atividades.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              2. Responsabilidade do operador
            </h2>
            <p className="mt-1">
              O operador é responsável pela execução dos serviços turísticos
              ofertados na plataforma, incluindo logística, segurança,
              atendimento aos clientes, cumprimento de horários e demais
              aspectos operacionais da atividade.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              3. Licenças e autorizações
            </h2>
            <p className="mt-1">
              O operador declara possuir todas as licenças, registros e
              autorizações exigidas pela legislação brasileira para a prestação
              dos serviços turísticos oferecidos, incluindo, quando aplicável,
              registro válido no CADASTUR e demais certificações obrigatórias.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              4. Pagamentos
            </h2>
            <p className="mt-1">
              A NativaGo recebe apenas o valor de reserva correspondente a 15%
              (quinze por cento) do valor total da experiência, a título de taxa
              de intermediação e garantia de vaga.
            </p>
            <p className="mt-1">
              O valor restante é pago diretamente ao operador pelo cliente, no
              dia da atividade ou conforme instruções informadas na plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              5. Cancelamentos
            </h2>
            <p className="mt-1">
              O operador se compromete a cumprir a política de cancelamento
              informada na plataforma, respeitando prazos, condições de reembolso
              e eventuais penalidades estabelecidas para cancelamentos por parte
              do operador ou do cliente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              6. Responsabilidade civil
            </h2>
            <p className="mt-1">
              Danos, acidentes, perdas, atrasos ou quaisquer incidentes
              ocorridos antes, durante ou após a atividade turística são de
              responsabilidade exclusiva do operador, que deverá adotar todas as
              medidas de segurança e conformidade exigidas pela legislação
              aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              7. Veracidade das informações
            </h2>
            <p className="mt-1">
              O operador declara que todas as informações fornecidas à NativaGo
              e publicadas na plataforma (descrições, preços, políticas,
              credenciais, documentos, fotos e demais dados) são verdadeiras,
              completas e atualizadas, responsabilizando-se por sua exatidão.
            </p>
          </section>

          <section className="border-t border-slate-200 pt-4">
            <h2 className="text-base font-semibold text-slate-900">
              Aceite digital
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-800">
              "Declaro que li e aceito o contrato de intermediação NativaGo."
            </p>
            <p className="mt-1 text-xs text-slate-500">
              O aceite digital é colhido por meio dos fluxos de cadastro e
              verificação de operadores na plataforma, dispensando assinatura
              física deste documento.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
