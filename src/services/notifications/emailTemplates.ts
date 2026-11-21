// Plantillas de los avisos de reserva que envía la cola (outbox). Se renderizan
// al momento de enviar, con los datos actuales de la reserva. Idioma: portugués
// si el país de la experiencia es Brasil (piloto), español en cualquier otro caso.
// TODO: guardar el idioma del viajero en la reserva cuando el Marketplace lo envíe.

export type Lang = 'es' | 'pt';

export interface BookingMailData {
  bookingCode: string;
  experienceTitle: string;
  guestName: string;
  guestEmail: string;
  guests: number;
  date: Date;
  timeZone: string;
  operatorName: string;
  operatorEmail: string;
  meetingPoint: string | null;
  reason: string | null;
  voucherUrl: string;
  panelUrl: string;
  lang: Lang;
}

export function langForCountry(countryCode: string | null | undefined): Lang {
  return (countryCode ?? '').toUpperCase() === 'BR' ? 'pt' : 'es';
}

export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function dateLabel(d: BookingMailData): string {
  return d.date.toLocaleString(d.lang === 'pt' ? 'pt-BR' : 'es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: d.timeZone,
  });
}

function layout(banner: string, bannerColor: string, bodyHtml: string, footer: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#0F1117;padding:24px 32px;text-align:center">
      <span style="font-size:22px;font-weight:900;letter-spacing:-0.03em"><span style="color:#0EAEBC">Nativa</span><span style="color:#FA9008">Go</span></span>
    </div>
    <div style="background:${bannerColor};padding:18px 32px;text-align:center">
      <p style="margin:0;color:#fff;font-size:18px;font-weight:900">${esc(banner)}</p>
    </div>
    <div style="padding:32px;color:#334155;font-size:14px;line-height:1.6">${bodyHtml}</div>
    <div style="background:#F8FAFC;padding:16px 32px;text-align:center;border-top:1px solid #E2E8F0">
      <p style="margin:0;font-size:11px;color:#94A3B8">${esc(footer)}</p>
    </div>
  </div>
</body></html>`;
}

function detailsBlock(d: BookingMailData, labels: { exp: string; date: string; people: string; code: string }): string {
  return `<div style="background:#F8FAFC;border-radius:10px;padding:14px 16px;margin:16px 0">
    <p style="margin:0 0 4px"><strong>${esc(labels.exp)}:</strong> ${esc(d.experienceTitle)}</p>
    <p style="margin:0 0 4px"><strong>${esc(labels.date)}:</strong> ${esc(dateLabel(d))}</p>
    <p style="margin:0 0 4px"><strong>${esc(labels.people)}:</strong> ${d.guests}</p>
    <p style="margin:0"><strong>${esc(labels.code)}:</strong> ${esc(d.bookingCode)}</p>
  </div>`;
}

function button(href: string, text: string): string {
  return `<div style="text-align:center;margin:24px 0 8px"><a href="${esc(href)}" style="display:inline-block;background:#0EAEBC;color:#fff;font-weight:700;padding:12px 28px;border-radius:12px;text-decoration:none">${esc(text)}</a></div>`;
}

export interface RenderedMail {
  to: string;
  subject: string;
  html: string;
}

// Reserva recibida (aún pendiente de confirmación) — al viajero.
export function guestBookingReceived(d: BookingMailData): RenderedMail {
  const pt = d.lang === 'pt';
  const labels = pt
    ? { exp: 'Experiência', date: 'Data', people: 'Pessoas', code: 'Código' }
    : { exp: 'Experiencia', date: 'Fecha', people: 'Personas', code: 'Código' };
  const body = pt
    ? `<p>Olá <strong>${esc(d.guestName)}</strong>,</p>
       <p>Recebemos o seu pedido de reserva. O operador vai confirmá-la em breve e você receberá outro e-mail. O pagamento é feito diretamente ao operador no dia da atividade.</p>
       ${detailsBlock(d, labels)}${button(d.voucherUrl, 'Ver minha reserva')}`
    : `<p>Hola <strong>${esc(d.guestName)}</strong>,</p>
       <p>Recibimos tu solicitud de reserva. El operador la confirmará pronto y recibirás otro correo. El pago se hace directamente al operador el día de la actividad.</p>
       ${detailsBlock(d, labels)}${button(d.voucherUrl, 'Ver mi reserva')}`;
  return {
    to: d.guestEmail,
    subject: pt ? `Pedido de reserva recebido — ${d.experienceTitle}` : `Solicitud de reserva recibida — ${d.experienceTitle}`,
    html: layout(pt ? 'Pedido de reserva recebido' : 'Solicitud de reserva recibida', '#0EAEBC', body, '© 2026 NativaGo'),
  };
}

// Reserva nueva — al operador.
export function operatorNewBooking(d: BookingMailData): RenderedMail {
  const pt = d.lang === 'pt';
  const labels = pt
    ? { exp: 'Experiência', date: 'Data', people: 'Pessoas', code: 'Código' }
    : { exp: 'Experiencia', date: 'Fecha', people: 'Personas', code: 'Código' };
  const body = pt
    ? `<p>Olá <strong>${esc(d.operatorName)}</strong>,</p>
       <p>Você tem uma nova reserva de <strong>${esc(d.guestName)}</strong>. Confirme ou cancele no painel assim que possível, conferindo a sua disponibilidade em outros canais.</p>
       ${detailsBlock(d, labels)}${button(d.panelUrl, 'Abrir painel de reservas')}`
    : `<p>Hola <strong>${esc(d.operatorName)}</strong>,</p>
       <p>Tienes una nueva reserva de <strong>${esc(d.guestName)}</strong>. Confírmala o cancélala en el panel lo antes posible, revisando tu disponibilidad en otros canales.</p>
       ${detailsBlock(d, labels)}${button(d.panelUrl, 'Abrir panel de reservas')}`;
  return {
    to: d.operatorEmail,
    subject: pt ? `Nova reserva — ${d.experienceTitle}` : `Nueva reserva — ${d.experienceTitle}`,
    html: layout(pt ? 'Nova reserva' : 'Nueva reserva', '#FA9008', body, '© 2026 NativaGo'),
  };
}

// Reserva confirmada por el operador — al viajero, con punto de encuentro.
export function guestBookingConfirmed(d: BookingMailData): RenderedMail {
  const pt = d.lang === 'pt';
  const labels = pt
    ? { exp: 'Experiência', date: 'Data', people: 'Pessoas', code: 'Código' }
    : { exp: 'Experiencia', date: 'Fecha', people: 'Personas', code: 'Código' };
  const meeting = d.meetingPoint
    ? `<div style="background:#F0FDFA;border-radius:10px;padding:12px 16px;margin:0 0 16px"><p style="margin:0;font-size:12px;font-weight:700;text-transform:uppercase;color:#0F766E">${pt ? 'Ponto de encontro' : 'Punto de encuentro'}</p><p style="margin:4px 0 0">${esc(d.meetingPoint)}</p></div>`
    : '';
  const body = pt
    ? `<p>Olá <strong>${esc(d.guestName)}</strong>,</p>
       <p>Boas notícias: a sua reserva foi <strong>confirmada</strong>. Apresente o QR da sua reserva no check-in e pague o valor diretamente ao operador.</p>
       ${detailsBlock(d, labels)}${meeting}${button(d.voucherUrl, 'Abrir voucher com QR')}`
    : `<p>Hola <strong>${esc(d.guestName)}</strong>,</p>
       <p>Buenas noticias: tu reserva fue <strong>confirmada</strong>. Presenta el QR de tu reserva en el check-in y paga el valor directamente al operador.</p>
       ${detailsBlock(d, labels)}${meeting}${button(d.voucherUrl, 'Abrir voucher con QR')}`;
  return {
    to: d.guestEmail,
    subject: pt ? `Reserva confirmada — ${d.experienceTitle}` : `Reserva confirmada — ${d.experienceTitle}`,
    html: layout(pt ? 'Reserva confirmada' : 'Reserva confirmada', '#10B981', body, '© 2026 NativaGo'),
  };
}

// Reserva cancelada — al viajero.
export function guestBookingCancelled(d: BookingMailData): RenderedMail {
  const pt = d.lang === 'pt';
  const reason = d.reason
    ? `<div style="background:#F8FAFC;border-radius:10px;padding:12px 16px;margin:0 0 16px"><p style="margin:0;font-size:12px;font-weight:700;text-transform:uppercase;color:#94A3B8">${pt ? 'Motivo' : 'Motivo'}</p><p style="margin:4px 0 0">${esc(d.reason)}</p></div>`
    : '';
  const body = pt
    ? `<p>Olá <strong>${esc(d.guestName)}</strong>,</p>
       <p>A sua reserva de <strong>${esc(d.experienceTitle)}</strong> para ${esc(dateLabel(d))} foi cancelada. Nada foi cobrado.</p>${reason}
       <p>Você pode explorar outras atividades no NativaGo quando quiser.</p>`
    : `<p>Hola <strong>${esc(d.guestName)}</strong>,</p>
       <p>Tu reserva de <strong>${esc(d.experienceTitle)}</strong> para el ${esc(dateLabel(d))} fue cancelada. No se te cobró nada.</p>${reason}
       <p>Puedes explorar otras actividades en NativaGo cuando quieras.</p>`;
  return {
    to: d.guestEmail,
    subject: pt ? `Reserva cancelada — ${d.experienceTitle}` : `Reserva cancelada — ${d.experienceTitle}`,
    html: layout(pt ? 'Sua reserva foi cancelada' : 'Tu reserva fue cancelada', '#EF4444', body, '© 2026 NativaGo'),
  };
}

// Reserva cancelada por el viajero o por soporte — al operador.
export function operatorBookingCancelled(d: BookingMailData): RenderedMail {
  const pt = d.lang === 'pt';
  const labels = pt
    ? { exp: 'Experiência', date: 'Data', people: 'Pessoas', code: 'Código' }
    : { exp: 'Experiencia', date: 'Fecha', people: 'Personas', code: 'Código' };
  const body = pt
    ? `<p>Olá <strong>${esc(d.operatorName)}</strong>,</p>
       <p>A reserva de <strong>${esc(d.guestName)}</strong> foi cancelada. O cupo volta a ficar disponível.</p>${detailsBlock(d, labels)}`
    : `<p>Hola <strong>${esc(d.operatorName)}</strong>,</p>
       <p>La reserva de <strong>${esc(d.guestName)}</strong> fue cancelada. El cupo vuelve a estar disponible.</p>${detailsBlock(d, labels)}`;
  return {
    to: d.operatorEmail,
    subject: pt ? `Reserva cancelada — ${d.experienceTitle}` : `Reserva cancelada — ${d.experienceTitle}`,
    html: layout(pt ? 'Reserva cancelada' : 'Reserva cancelada', '#EF4444', body, '© 2026 NativaGo'),
  };
}

// Pedido de valoración tras el check-in — al viajero.
export function guestReviewRequest(d: BookingMailData & { reviewUrl: string }): RenderedMail {
  const pt = d.lang === 'pt';
  const body = pt
    ? `<p>Olá <strong>${esc(d.guestName)}</strong>,</p>
       <p>Esperamos que tenha aproveitado <strong>${esc(d.experienceTitle)}</strong>. A sua opinião ajuda outros viajantes e o operador a melhorar — leva menos de um minuto.</p>
       ${button(d.reviewUrl, 'Avaliar minha experiência')}`
    : `<p>Hola <strong>${esc(d.guestName)}</strong>,</p>
       <p>Esperamos que hayas disfrutado <strong>${esc(d.experienceTitle)}</strong>. Tu opinión ayuda a otros viajeros y a que el operador siga mejorando — toma menos de un minuto.</p>
       ${button(d.reviewUrl, 'Calificar mi experiencia')}`;
  return {
    to: d.guestEmail,
    subject: pt ? `Como foi a sua experiência? — ${d.experienceTitle}` : `Cuéntanos cómo estuvo — ${d.experienceTitle}`,
    html: layout(pt ? 'Como foi a sua experiência?' : '¿Cómo estuvo tu experiencia?', '#FA9008', body, '© 2026 NativaGo'),
  };
}
