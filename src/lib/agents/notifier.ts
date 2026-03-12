import { Resend } from "resend";
import type { ResearchReport } from "./types";

/**
 * Notifier: sends the finished report via email using Resend.
 * Skips silently if RESEND_API_KEY is not configured.
 */
export async function sendReportEmail(
  report: ResearchReport,
  to: string
): Promise<{ sent: boolean; to?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    return { sent: false, error: "Email not configured (missing RESEND_API_KEY)" };
  }

  try {
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from,
      to,
      subject: `Research Report: ${report.title}`,
      html: `
        <h1>${report.title}</h1>
        <p>Your research report is ready. Here's the summary:</p>
        <div style="white-space: pre-wrap; font-family: sans-serif;">
          ${report.markdown.slice(0, 2000)}
          ${report.markdown.length > 2000 ? "\n\n... (report truncated for email)" : ""}
        </div>
        <hr/>
        <p><strong>Sources:</strong></p>
        <ul>
          ${report.sources.map((s) => `<li><a href="${s.url}">${s.title}</a></li>`).join("")}
        </ul>
      `,
    });

    return { sent: true, to };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}
