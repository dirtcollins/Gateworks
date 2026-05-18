import "server-only";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const emailEnabled = Boolean(apiKey);

export const EMAIL_FROM = process.env.EMAIL_FROM || "Gateworks <quotes@gateworks.com>";

const resend = apiKey ? new Resend(apiKey) : null;

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type SendEmailResult = {
  ok: boolean;
  reason?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!resend) {
    return { ok: false, reason: "Email is not configured. Set RESEND_API_KEY." };
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text
    });

    if (error) {
      return { ok: false, reason: error.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Email send failed."
    };
  }
}
