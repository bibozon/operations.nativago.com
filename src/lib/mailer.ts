// Mailer mínimo del CMS — solo Resend (HTTP API), sin dependencia nueva de SMTP.
// Si RESEND_API_KEY no está configurada, el envío se omite silenciosamente
// (logueando una advertencia) en vez de romper el flujo que lo llama (ej. check-in).

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: MailOptions): Promise<void> {
  const resendKey = (process.env.RESEND_API_KEY ?? '').trim();
  if (!resendKey) {
    console.warn('[mailer] RESEND_API_KEY no configurada — correo omitido:', opts.subject, '->', opts.to);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

function reviewRequestHtml(d: { guestName: string; experienceTitle: string; reviewUrl: string }) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#0F1117;padding:24px 32px;text-align:center">
      <span style="font-size:22px;font-weight:900;letter-spacing:-0.03em">
        <span style="color:#0EAEBC">Nativa</span><span style="color:#FA9008">Go</span>
      </span>
    </div>
    <div style="background:#FA9008;padding:18px 32px;text-align:center">
      <p style="margin:0;color:#fff;font-size:18px;font-weight:900">¿Cómo estuvo tu experiencia? ⭐</p>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 8px;font-size:15px;color:#0F172A">Hola <strong>${d.guestName}</strong>,</p>
      <p style="margin:0 0 24px;font-size:14px;color:#64748B;line-height:1.6">
        Esperamos que hayas disfrutado <strong>${d.experienceTitle}</strong>. Tu opinión ayuda a otros viajeros
        y a que el operador siga mejorando — toma menos de un minuto.
      </p>
      <div style="text-align:center;margin-bottom:8px">
        <a href="${d.reviewUrl}"
          style="display:inline-block;background:#0EAEBC;color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:12px;text-decoration:none">
          Calificar mi experiencia
        </a>
      </div>
    </div>
    <div style="background:#F8FAFC;padding:16px 32px;text-align:center;border-top:1px solid #E2E8F0">
      <p style="margin:0;font-size:11px;color:#94A3B8">© 2026 NativaGo · Turismo local auténtico</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendReviewRequestEmail(d: {
  guestEmail: string;
  guestName: string;
  experienceTitle: string;
  reviewUrl: string;
}) {
  const from = process.env.EMAIL_FROM ?? 'NativaGo <noreply@nativago.com>';
  await sendEmail({
    from,
    to: d.guestEmail,
    subject: `⭐ Cuéntanos cómo estuvo — ${d.experienceTitle}`,
    html: reviewRequestHtml(d),
  });
}
