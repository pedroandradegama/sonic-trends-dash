import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AgendaEmailRequest {
  medicoNome: string;
  diasAgenda: {
    data: string;
    horarioInicio: string;
    horarioFim: string;
  }[];
  comentarios?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { medicoNome, diasAgenda, comentarios }: AgendaEmailRequest = await req.json();

    console.log("Recebendo solicitação de email de agenda:", { medicoNome, diasAgenda, comentarios });

    // Format the schedule days as HTML table rows
    const diasHtml = diasAgenda
      .map(
        (dia) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${dia.data}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${dia.horarioInicio}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${dia.horarioFim}</td>
        </tr>
      `
      )
      .join("");

    const comentariosSection = comentarios
      ? `<p style="margin-top: 20px;"><strong>Comentários/Observações:</strong></p>
         <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-style: italic;">${comentarios}</p>`
      : "";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">📅 Comunicação de Abertura de Agenda</h2>
        
        <p>O médico radiologista <strong>${medicoNome}</strong> comunicou disponibilidade para os seguintes dias:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <thead>
            <tr style="background: #0d9488; color: white;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Data</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Início</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Término</th>
            </tr>
          </thead>
          <tbody>
            ${diasHtml}
          </tbody>
        </table>
        
        ${comentariosSection}
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Esta é uma mensagem automática enviada pelo Portal Analítico IMAG.
        </p>
      </div>
    `;

    // Recipients
    const recipients = [
      "pedro.andrade@imagdiagnostico.com.br",
      "brunalima.imag@gmail.com",
      "adm@imagdiagnostico.com.br",
    ];

    const emailResponse = await resend.emails.send({
      from: "Portal IMAG <onboarding@resend.dev>",
      to: recipients,
      subject: `[Abertura de Agenda] ${medicoNome} - ${diasAgenda.length} dia(s) comunicado(s)`,
      html: emailHtml,
    });

    console.log("Email enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email de agenda:", error);
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
