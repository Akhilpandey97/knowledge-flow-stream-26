import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const { file_path, insights } = await req.json();

    if (!file_path || !insights) {
      return new Response(JSON.stringify({ error: "Missing file_path or insights" }), { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user_id for this file_path
    const { data: uploadData, error: uploadError } = await supabase
      .from("user_document_uploads")
      .select("user_id")
      .eq("file_path", file_path)
      .single();

    if (uploadError || !uploadData?.user_id) {
      return new Response(
        JSON.stringify({ error: `Could not find user for file_path: ${file_path}` }),
        { status: 400 }
      );
    }

    // Insert the insights into ai_knowledge_insights_complex
    const { error: insertError } = await supabase
      .from("ai_knowledge_insights_complex")
      .insert({
        user_id: uploadData.user_id,
        file_path,
        insights,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: `Failed to insert insights: ${insertError.message}` }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500 }
    );
  }
});
