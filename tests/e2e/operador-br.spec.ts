/**
 * NativaGo — Flujo completo: Operador Brasil
 *
 * BR1  Se registra como guía (persona natural) en Manaus
 * BR2  Queda en estado DRAFT en su panel
 * BR3  Envía su cuenta para revisión (DRAFT → PENDING)
 * BR4  Admin la aprueba (PENDING → APPROVED)
 * BR5  Operador acepta el contrato de intermediación
 * BR6  Crea su primera experiencia con precio en BRL (reais)
 * BR7  La experiencia aparece en la lista de su panel
 *
 * Notas:
 *  - El precio en BRL se ingresa como número entero (p. ej. 1500).
 *    NativaGo lo muestra como "R$ 1.500" al cliente brasileño.
 *  - Si Manaus no existe en la DB, el test se salta con un mensaje claro
 *    (el globalSetup lo crea, pero puede que no haya corrido).
 */

import { test, expect } from '@playwright/test';
import { makeOperadorBR }           from './support/test-data';
import { OperatorRegisterPage }     from './pages/cms/OperatorRegisterPage';
import { OperatorDashboardPage }    from './pages/cms/OperatorDashboardPage';
import { AdminVerificationPage }    from './pages/cms/AdminVerificationPage';
import { ContractPage }             from './pages/cms/ContractPage';
import { ExperienceFormPage }       from './pages/cms/ExperienceFormPage';

test('BR — Operador brasileño registra cuenta y publica experiencia en BRL', async ({ browser }) => {
  const op = makeOperadorBR();
  console.log(`\n▶  Operador BR: ${op.name} (${op.email})`);

  const operadorCtx  = await browser.newContext();
  const adminCtx     = await browser.newContext();
  const operadorPage = await operadorCtx.newPage();
  const adminPage    = await adminCtx.newPage();

  try {
    // ── BR1. Registro ─────────────────────────────────────────────────
    const registerPage = new OperatorRegisterPage(operadorPage);

    // Verificar que Manaus existe en el select antes de intentar registrar
    await operadorPage.goto('/register/operator');
    await operadorPage.waitForLoadState('networkidle');
    const cityOptions = await operadorPage.locator('select[name="cityId"] option').allTextContents();
    const hasManaus   = cityOptions.some(o => o.trim().toLowerCase() === 'manaus');
    if (!hasManaus) {
      console.warn('  ⚠  Manaus no está disponible en el select — test BR skipped (corre globalSetup)');
      test.skip();
      return;
    }

    await registerPage.registerOperator({
      prestadorTipo:  op.prestadorTipo,
      categoria:      op.categoria,
      name:           op.name,
      email:          op.email,
      phone:          op.phone,
      password:       op.password,
      cityLabel:      op.cityLabel,
      identityDoc:    op.identityDoc,
      paymentAccount: op.paymentAccount,
    });
    console.log('  ✓ BR1 — Registro completo → /operator/dashboard');

    // ── BR2. Panel DRAFT ──────────────────────────────────────────────
    const dashboard = new OperatorDashboardPage(operadorPage);
    await dashboard.expectStatus('DRAFT');
    const pct = await dashboard.progressPercent();
    expect(pct).toBeGreaterThan(0);
    console.log(`  ✓ BR2 — Estado DRAFT | Progreso: ${pct}%`);

    // ── BR3. Enviar para revisión ─────────────────────────────────────
    await dashboard.submitForReview();
    await dashboard.expectStatus('PENDING');
    console.log('  ✓ BR3 — Cuenta enviada para revisión (PENDING)');

    // ── BR4. Admin aprueba ────────────────────────────────────────────
    const adminVerification = new AdminVerificationPage(adminPage);
    await adminVerification.loginAsAdmin();
    await adminVerification.goto();
    const approved = await adminVerification.approveOperator(op.name);
    expect(approved).toBe(true);
    await adminVerification.expectOperatorAbsent(op.name);
    console.log(`  ✓ BR4 — Operador aprobado por admin`);

    // ── BR5. Aceptar contrato ─────────────────────────────────────────
    await operadorPage.goto('/operator/dashboard');
    const contract = new ContractPage(operadorPage);
    await contract.accept();
    console.log('  ✓ BR5 — Contrato aceptado → /admin');

    await expect(operadorPage).toHaveURL(/\/admin/, { timeout: 8_000 });

    // ── BR6. Crear experiencia con precio en BRL ──────────────────────
    const expForm = new ExperienceFormPage(operadorPage);
    await expForm.createExperience(op.experience);
    console.log(`  ✓ BR6 — Experiencia creada: "${op.experience.title}" — R$ ${Number(op.experience.price).toLocaleString('pt-BR')}`);

    // ── BR7. Verificar en la lista ────────────────────────────────────
    await expForm.expectExperienceInList(op.experience.title);
    console.log(`  ✓ BR7 — Experiencia visible en el panel del operador`);

  } finally {
    await operadorCtx.close();
    await adminCtx.close();
  }
});
