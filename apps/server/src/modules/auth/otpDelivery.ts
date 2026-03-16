import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import { env } from "../../config/env";

type OtpChannel = "email" | "phone";
type OtpPurpose = "registration" | "resend" | "password_reset";

const appName = "Rideforge";

let twilioClient: ReturnType<typeof twilio> | null = null;
let sendgridReady = false;

if (env.sendgridApiKey) {
  sgMail.setApiKey(env.sendgridApiKey);
  sendgridReady = true;
}
if (env.twilioAccountSid && env.twilioAuthToken) {
  twilioClient = twilio(env.twilioAccountSid, env.twilioAuthToken);
}

export async function deliverOtp(input: {
  channel: OtpChannel;
  target: string;
  code: string;
  purpose: OtpPurpose;
}): Promise<void> {
  const body = `${appName} verification code: ${input.code}. It expires in 10 minutes.`;
  const subject = `${appName} verification code`;

  if (env.otpProviderMode === "log") {
    console.log(`[otp.log] ${input.channel.toUpperCase()} -> ${input.target} | ${input.code}`);
    return;
  }

  if (input.channel === "email") {
    if (!sendgridReady || !env.sendgridFromEmail) {
      handleProviderMissing("email", "SendGrid");
      console.log(`[otp.log-fallback] EMAIL -> ${input.target} | ${input.code}`);
      return;
    }
    await sgMail.send({
      to: input.target,
      from: env.sendgridFromEmail,
      subject,
      text: body,
      html: `<p>${body}</p>`,
    });
    return;
  }

  if (!twilioClient || !env.twilioFromPhone) {
    handleProviderMissing("phone", "Twilio");
    console.log(`[otp.log-fallback] PHONE -> ${input.target} | ${input.code}`);
    return;
  }

  await twilioClient.messages.create({
    body,
    from: env.twilioFromPhone,
    to: input.target,
  });
}

function handleProviderMissing(channel: OtpChannel, provider: string): void {
  const message = `${provider} not configured for ${channel} OTP`;
  if (env.otpRequireLiveProviders) {
    throw new Error(message);
  }
  console.warn(`[otp.warn] ${message}; using log fallback`);
}
