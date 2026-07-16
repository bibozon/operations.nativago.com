/**
 * NativaGo — Flujo completo: Operador Colombia
 *
 * CO1  Se registra como agencia (persona jurídica) en Cartagena
 * CO2  Queda en estado DRAFT en su panel
 * CO3  Envía su cuenta para revisión (DRAFT → PENDING)
 * CO4  Admin la aprueba (PENDING → APPROVED)
 * CO5  Operador acepta el contrato de intermediación
 * CO6  Crea su primera experiencia con precio en COP (pesos colombianos)
 * CO7  La experiencia aparece en la lista de su panel
 *
 * Notas:
 *  - Se usan dos contextos de browser en el mismo test (operador + admin)
 *    para simular la aprobación cruzada sin compartir cookies.
 *  - El precio en COP se ingresa como número entero (p. ej. 280000).
 *    NativaGo lo cobra en COP porque el operador opera en Colombia.
 */

import { test, expect } from '@playwright/test';
import { makeOperadorCO }           from './support/test-data';
import { OperatorRegisterPage }     from './pages/cms/OperatorRegisterPage';
import { OperatorDashboardPage }    from './pages/cms/OperatorDashboardPage';
import { AdminVerificationPage }    from './pages/cms/AdminVerificationPage';
import { ContractPage }             from './pages/cms/ContractPage';
import { ExperienceFormPage }       from './pages/cms/ExperienceFormPage';

test('CO — Operador colombiano registra cuenta y publica experiencia en COP', async ({ browser }) => {
  const op = makeOperadorCO();
  console.log(`\n▶  Operador CO: ${op.name} (${op.email})`);

  // ── Dos contextos de browser independientes ──────────────────────────
  const operadorCtx = await browser.newContext();
  const adminCtx    = await browser.newContext();
  const operadorPage = await operadorCtx.newPage();
  const adminPage    = await adminCtx.newPage();

  try {
    // ── CO1. Registro ─────────────────────────────────────────────────
    const registerPage = new OperatorRegisterPage(operadorPage);
    await registerPage.registerOperator({
      prestadorTipo:  op.prestadorTipo,
      categoria:      op.categoria,
      name:           op.name,
      legalRep:       op.legalRep,
      email:          op.email,
      phone:          op.phone,
      password:       op.password,
      cityLabel:      op.cityLabel,
      identityDoc:    op.identityDoc,
      paymentAccount: op.paymentAccount,
    });
    console.log('  ✓ CO1 — Registro completo → /operator/dashboard');

    // ── CO2. Panel DRAFT ──────────────────────────────────────────────
    const dashboard = new OperatorDashboardPage(operadorPage);
    await dashboard.expectStatus('DRAFT');
    const pct = await dashboard.progressPercent();
    expect(pct).toBeGreaterThan(0);
    console.log(`  ✓ CO2 — Estado DRAFT | Progreso: ${pct}%`);

    // ── CO3. Enviar para revisión ─────────────────────────────────────
    await dashboard.submitForReview();
    await dashboard.expectStatus('PENDING');
    console.log('  ✓ CO3 — Cuenta enviada para revisión (PENDING)');

    // ── CO4. Admin aprueba ────────────────────────────────────────────
    const adminVerification = new AdminVerificationPage(adminPage);
    await adminVerification.loginAsAdmin();
    await adminVerification.goto();
    const approved = await adminVerification.approveOperator(op.name);
    expect(approved).toBe(true);
    await adminVerification.expectOperatorAbsent(op.name);
    console.log(`  ✓ CO4 — Operador aprobado por admin`);

    // ── CO5. Aceptar contrato ─────────────────────────────────────────
    // Después de la aprobación, el panel redirige a /legal/operador/aceite
    await operadorPage.goto('/operator/dashboard');
    const contract = new ContractPage(operadorPage);
    await contract.accept();
    console.log('  ✓ CO5 — Contrato aceptado → /admin');

    // Verificar que llegó al panel de operador
    await expect(operadorPage).toHaveURL(/\/admin/, { timeout: 8_000 });

    // ── CO6. Crear experiencia con precio en COP ──────────────────────
    const expForm = new ExperienceFormPage(operadorPage);
    await expForm.createExperience(op.experience);
    console.log(`  ✓ CO6 — Experiencia creada: "${op.experience.title}" — COP ${Number(op.experience.price).toLocaleString('es-CO')}`);

    // ── CO7. Verificar en la lista ────────────────────────────────────
    await expForm.expectExperienceInList(op.experience.title);
    console.log(`  ✓ CO7 — Experiencia visible en el panel del operador`);

  } finally {
    await operadorCtx.close();
    await adminCtx.close();
  }
});
