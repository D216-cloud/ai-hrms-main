import { createTransporter } from '@/lib/email';

export async function GET() {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      const disabled = process.env.DISABLE_EMAIL === 'true';
      const reason = disabled ? 'DISABLE_EMAIL=true' : 'missing SMTP / Gmail env variables';
      return Response.json({ configured: false, disabled, reason });
    }

    // Optionally verify connection in production/non-dev
    try {
      await transporter.verify();
      return Response.json({ configured: true });
    } catch (err) {
      return Response.json({ configured: false, reason: err?.message || String(err) });
    }
  } catch (err) {
    return Response.json({ configured: false, reason: err?.message || String(err) });
  }
}
