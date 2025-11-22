import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, fileUrls } = await req.json();
    console.log("AI Assistant - Processing request with messages:", messages?.length, "files:", fileUrls?.length);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build messages with images/PDFs if provided
    const aiMessages = [];
    
    // System prompt
    aiMessages.push({
      role: "system",
      content: `Você é um assistente especializado em extrair informações de projetos de incorporação imobiliária.
      
Sua tarefa é analisar textos, imagens, documentos PDF e extrair as seguintes informações:
- Nome do projeto
- Endereço completo
- Área total (em m²)
- Status na esteira (viability, project, approvals, sales, delivery)
- Descrição do projeto
- Qualquer outra informação relevante

Para determinar o status:
- "viability": Estudos iniciais, análise de viabilidade, fotos de terreno
- "project": Projetos arquitetônicos, plantas, aprovações pendentes
- "approvals": Documentos de aprovação, alvarás, licenças
- "sales": Material de vendas, tabelas de preço, propostas
- "delivery": Cronogramas de obra, documentos de entrega

SEMPRE responda em JSON válido no seguinte formato:
{
  "name": "Nome do Projeto",
  "address": "Endereço completo",
  "area": 1500.50,
  "status": "viability",
  "description": "Descrição detalhada",
  "confidence": "high/medium/low",
  "extracted_data": {}
}`
    });

    // Add user messages
    for (const msg of messages) {
      if (msg.role === "user") {
        aiMessages.push({
          role: "user",
          content: msg.content
        });
      } else if (msg.role === "assistant") {
        aiMessages.push({
          role: "assistant",
          content: msg.content
        });
      }
    }

    // Add files as images in the last user message
    if (fileUrls && fileUrls.length > 0) {
      const fileContents = [];
      
      for (const url of fileUrls) {
        console.log("Processing file URL:", url);
        
        // Download file from Supabase Storage
        const fileResponse = await fetch(url);
        if (!fileResponse.ok) {
          console.error("Failed to fetch file:", url);
          continue;
        }
        
        const blob = await fileResponse.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        // Determine mime type
        const mimeType = blob.type || "image/jpeg";
        
        if (mimeType.startsWith("image/")) {
          fileContents.push({
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`
            }
          });
        } else if (mimeType === "application/pdf") {
          fileContents.push({
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`
            }
          });
        }
      }
      
      if (fileContents.length > 0) {
        // Replace last user message with multimodal content
        const lastMessage = aiMessages[aiMessages.length - 1];
        if (lastMessage.role === "user") {
          lastMessage.content = [
            { type: "text", text: lastMessage.content },
            ...fileContents
          ];
        }
      }
    }

    console.log("Calling Lovable AI with", aiMessages.length, "messages");

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: aiMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";
    
    console.log("AI Response:", aiResponse.substring(0, 200));

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        usage: data.usage 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-project-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});