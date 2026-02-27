import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { sendEmailWithResend } from "@/providers/email/resendAdapter";
import { sendWhatsAppMessage } from "@/providers/whatsapp/whatsappAdapter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      bookingId,
      channel,
      to,
      subject,
      template,
      payload,
      html,
      text,
    } = body as {
      bookingId: string;
      channel: "EMAIL" | "WHATSAPP";
      to: string;
      subject?: string;
      template?: string;
      payload?: any;
      html?: string;
      text?: string;
    };

    if (!bookingId || !channel || !to) {
      return NextResponse.json(
        { error: "bookingId, channel and to are required" },
        { status: 400 }
      );
    }

    let status: "QUEUED" | "SENT" | "FAILED" = "QUEUED";
    let providerId: string | undefined;
    let errorMessage: string | undefined;

    if (channel === "EMAIL") {
      const result = await sendEmailWithResend({ to, subject: subject ?? "", html, text });
      status = result.success ? "SENT" : "FAILED";
      providerId = result.id;
      errorMessage = result.error;
    } else if (channel === "WHATSAPP") {
      const result = await sendWhatsAppMessage({ to, template: template ?? "", payload });
      status = result.success ? "SENT" : "FAILED";
      providerId = result.id;
      errorMessage = result.error;
    } else {
      return NextResponse.json({ error: "Unsupported channel" }, { status: 400 });
    }

    const communication = await prisma.communication.create({
      data: {
        bookingId,
        channel,
        template,
        payload,
        status,
        sentAt: status === "SENT" ? new Date() : null,
      },
    });

    return NextResponse.json(
      {
        communication,
        providerId,
        error: errorMessage,
      },
      { status: status === "SENT" ? 200 : 500 }
    );
  } catch (error) {
    console.error("/api/communication/send error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
