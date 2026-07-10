/**
 * Reusable branded HTML email templates.
 * Inline styles are used deliberately for maximum email-client compatibility.
 */

const brand = {
  navy: '#153063',
  navyDark: '#0a1c3f',
  rust: '#c05a17',
  bg: '#f4f6fb',
};

function layout(title: string, body: string): string {
  return `
  <div style="margin:0;padding:0;background:${brand.bg};font-family:Segoe UI,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="background:${brand.navy};border-radius:12px 12px 0 0;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;letter-spacing:1px;">BOKARO DEFENCE ACADEMY</h1>
        <p style="color:#e59a5f;margin:4px 0 0;font-size:13px;">Molding the Brave Hearts</p>
      </div>
      <div style="background:#fff;padding:32px 28px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(10,28,63,.08);">
        <h2 style="color:${brand.navyDark};margin-top:0;font-size:18px;">${title}</h2>
        ${body}
      </div>
      <p style="text-align:center;color:#8896b3;font-size:12px;margin-top:20px;">
        © ${new Date().getFullYear()} Bokaro Defence Academy. All rights reserved.
      </p>
    </div>
  </div>`;
}

function otpBlock(code: string): string {
  return `<div style="text-align:center;margin:24px 0;">
    <span style="display:inline-block;background:${brand.bg};border:2px dashed ${brand.rust};border-radius:10px;padding:16px 28px;font-size:30px;font-weight:700;letter-spacing:8px;color:${brand.navyDark};">${code}</span>
  </div>`;
}

export const emailTemplates = {
  signupOtp: (name: string, code: string, minutes: number) =>
    layout(
      'Verify your email',
      `<p>Hi ${name},</p>
       <p>Welcome to Bokaro Defence Academy! Use the code below to verify your email and activate your account.</p>
       ${otpBlock(code)}
       <p style="color:#5a6982;font-size:14px;">This code expires in ${minutes} minutes. If you didn't sign up, you can ignore this email.</p>`,
    ),

  loginOtp: (name: string, code: string, minutes: number) =>
    layout(
      'Your login code',
      `<p>Hi ${name},</p>
       <p>Use this one-time code to complete your login.</p>
       ${otpBlock(code)}
       <p style="color:#5a6982;font-size:14px;">This code expires in ${minutes} minutes. If this wasn't you, please secure your account.</p>`,
    ),

  forgotPassword: (name: string, code: string, minutes: number) =>
    layout(
      'Reset your password',
      `<p>Hi ${name},</p>
       <p>We received a request to reset your password. Use the code below to proceed.</p>
       ${otpBlock(code)}
       <p style="color:#5a6982;font-size:14px;">This code expires in ${minutes} minutes. If you didn't request this, no action is needed.</p>`,
    ),

  welcome: (name: string) =>
    layout(
      'Welcome aboard, cadet!',
      `<p>Hi ${name},</p>
       <p>Your account is now active. You're one step closer to a career in the Indian Armed Forces. Log in to explore courses, mock tests and study resources.</p>`,
    ),

  enrollmentConfirmation: (name: string, courseTitle: string) =>
    layout(
      'Enrollment confirmed',
      `<p>Hi ${name},</p>
       <p>You have successfully enrolled in <strong>${courseTitle}</strong>. Best of luck with your preparation!</p>`,
    ),

  contactResponse: (name: string, message: string) =>
    layout(
      'We received your message',
      `<p>Hi ${name},</p>
       <p>Thanks for reaching out to Bokaro Defence Academy. Our team will get back to you shortly.</p>
       <blockquote style="border-left:3px solid ${brand.rust};padding-left:12px;color:#5a6982;">${message}</blockquote>`,
    ),
};
