/**
 * Mock email service.
 *
 * In production, replace the body of each function with calls to your
 * email provider (Resend, SendGrid, Nodemailer, etc.).
 *
 * In development, the verification link is logged to the server console
 * AND returned in the API response so you can click it directly from
 * the register page without needing a real inbox.
 */

const isDev = process.env.NODE_ENV !== "production";

export interface SendVerificationResult {
  /** Only present in development — omitted in production responses */
  devLink?: string;
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
): Promise<SendVerificationResult> {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const link = `${base}/verify-email?token=${token}`;

  if (isDev) {
    // Simulate network latency to mimic a real provider
    await new Promise((r) => setTimeout(r, 80));

    console.log(
      [
        "",
        "┌─────────────────────────────────────────────────────┐",
        "│  [MOCK EMAIL]  Verificação de conta                 │",
        "├─────────────────────────────────────────────────────┤",
        `│  Para:    ${email.padEnd(41)}│`,
        `│  Nome:    ${name.padEnd(41)}│`,
        "│                                                     │",
        "│  Clique no link abaixo para verificar seu email:    │",
        `│  ${link.slice(0, 51).padEnd(51)}│`,
        ...(link.length > 51
          ? [`│  ${link.slice(51).padEnd(51)}│`]
          : []),
        "│                                                     │",
        "│  Este link expira em 24 horas.                      │",
        "└─────────────────────────────────────────────────────┘",
        "",
      ].join("\n"),
    );

    return { devLink: link };
  }

  // --- Production: plug in your email provider here ---
  // Example with Resend:
  //
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: "Clínica Dental <noreply@clinicadental.com.br>",
  //   to: email,
  //   subject: "Confirme seu email — Clínica Dental",
  //   html: `<p>Olá ${name},</p>
  //          <p>Clique no link abaixo para verificar seu email:</p>
  //          <a href="${link}">${link}</a>
  //          <p>Este link expira em 24 horas.</p>`,
  // });

  console.warn("[email] Production email provider not configured.");
  return {};
}
