import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SignupEmailRequest {
  email: string;
  role: string;
  department: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role, department }: SignupEmailRequest = await req.json();

    console.log("Sending signup email to:", email, "with role:", role);

    const signupUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?type=signup&token_hash=placeholder&redirect_to=${encodeURIComponent("https://leplvqapnexpgmivfdpl.supabase.co")}&email=${encodeURIComponent(email)}`;

    const roleTitle = role === 'exiting' ? 'Exiting Employee' : 
                     role === 'successor' ? 'Successor' : 
                     'Employee';

    const emailResponse = await resend.emails.send({
      from: "Knowledge Transfer System <onboarding@resend.dev>",
      to: [email],
      subject: `Welcome to the Knowledge Transfer System - ${roleTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">Welcome to Knowledge Transfer System</h1>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #334155; margin-top: 0;">Account Created Successfully!</h2>
            <p style="color: #64748b; line-height: 1.6;">
              Your account has been created with the following details:
            </p>
            <ul style="color: #64748b; line-height: 1.8;">
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Role:</strong> ${roleTitle}</li>
              <li><strong>Department:</strong> ${department}</li>
            </ul>
          </div>

          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Next Steps</h3>
            <p style="color: #1e3a8a; line-height: 1.6;">
              To complete your account setup and access the Knowledge Transfer System:
            </p>
            <ol style="color: #1e3a8a; line-height: 1.8;">
              <li>Check your email for a verification link from Supabase</li>
              <li>Click the verification link to activate your account</li>
              <li>Set up your password when prompted</li>
              <li>Login to the Knowledge Transfer System</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${signupUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Complete Account Setup
            </a>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #64748b; font-size: 14px; text-align: center;">
              If you have any questions or need assistance, please contact your system administrator.
            </p>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
              This email was sent by the Knowledge Transfer System. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-signup-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);