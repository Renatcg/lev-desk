import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  projectId: string;
  tempPassword: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, projectId, tempPassword }: NotificationRequest = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user and project data
    const { data: user } = await supabaseClient
      .from("profiles")
      .select("name, email, phone")
      .eq("id", userId)
      .single();

    const { data: project } = await supabaseClient
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();

    if (!user || !project) {
      throw new Error("User or project not found");
    }

    const loginUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify`;
    const changePasswordUrl = `${req.headers.get("origin")}/change-password`;

    // Send email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "LEV <onboarding@resend.dev>",
          to: [user.email],
          subject: `Bem-vindo ao projeto ${project.name}`,
          html: `
            <h1>Bem-vindo, ${user.name}!</h1>
            <p>Você foi adicionado ao projeto <strong>${project.name}</strong>.</p>
            <p>Use as credenciais abaixo para fazer login:</p>
            <ul>
              <li><strong>E-mail:</strong> ${user.email}</li>
              <li><strong>Senha temporária:</strong> ${tempPassword}</li>
            </ul>
            <p><a href="${changePasswordUrl}">Clique aqui para acessar o sistema</a></p>
            <p>Após o primeiro login, você será solicitado a alterar sua senha.</p>
            <p>Atenciosamente,<br>Equipe LEV</p>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error("Failed to send email:", await emailResponse.text());
      }
    }

    // Send WhatsApp via Evo API
    const evoUrl = Deno.env.get("EVO_API_URL");
    const evoKey = Deno.env.get("EVO_API_KEY");
    
    if (evoUrl && evoKey && user.phone) {
      const whatsappMessage = `Olá ${user.name}! Você foi adicionado ao projeto *${project.name}*.\n\nSua senha temporária é: *${tempPassword}*\n\nAcesse: ${changePasswordUrl}\n\nEquipe LEV`;
      
      const whatsappResponse = await fetch(evoUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${evoKey}`,
        },
        body: JSON.stringify({
          phone: user.phone,
          message: whatsappMessage,
        }),
      });

      if (!whatsappResponse.ok) {
        console.error("Failed to send WhatsApp:", await whatsappResponse.text());
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notifications sent" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
