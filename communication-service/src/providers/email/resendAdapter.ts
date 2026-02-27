export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface SendResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmailWithResend(params: SendEmailParams): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { success: false, error: "RESEND_API_KEY or RESEND_FROM_EMAIL not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: body };
    }

    const data = (await res.json()) as { id?: string };
    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message ?? "Resend request failed" };
  }
}
