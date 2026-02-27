export interface SendWhatsAppParams {
  to: string;
  template: string;
  payload?: any;
}

export interface WhatsAppResult {
  success: boolean;
  id?: string;
  error?: string;
}

// Adapter abstracto: deja el envío real a la implementación concreta.
// Esta implementación por defecto sólo devuelve error indicando que no está configurado.
export async function sendWhatsAppMessage(params: SendWhatsAppParams): Promise<WhatsAppResult> {
  console.warn("WhatsApp adapter not configured", params);
  return { success: false, error: "WhatsApp adapter not configured" };
}
