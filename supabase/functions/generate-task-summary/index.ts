import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, exitingEmployeeName } = await req.json();
    
    console.log('Generating AI summary for task:', task?.id);

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!task) {
      return new Response(
        JSON.stringify({ error: 'Task data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are an AI assistant helping with employee handover and knowledge transfer. Analyze the following completed task and provide a clear, actionable summary for the successor who is taking over.

TASK DETAILS:
- Title: ${task.title}
- Category: ${task.category || 'General'}
- Status: ${task.status}
- Priority: ${task.priority || 'medium'}
- Description: ${task.description || 'No description provided'}
- Notes/Knowledge Transfer: ${task.notes || 'No additional notes'}
- Due Date: ${task.dueDate || 'Not specified'}
- Previous Owner: ${exitingEmployeeName || 'Predecessor'}

Based on this completed handover task, generate a JSON response with:

1. "summary" - A comprehensive paragraph (2-4 sentences) explaining:
   - What was accomplished in this task
   - The key outcome or deliverable
   - Any important context the successor should know

2. "nextActionItems" - An array of specific follow-up actions the successor might need to take
   - Be practical and specific
   - Include timeframes if relevant
   - If the task is truly complete with no follow-ups needed, return an empty array

3. "hasNextActions" - Boolean indicating if there are any next actions required

IMPORTANT:
- Be concise but thorough
- Focus on actionable information
- If there are genuinely no next actions (task is fully wrapped up), set hasNextActions to false and nextActionItems to empty array
- Base your analysis on the actual task content provided

Return ONLY valid JSON in this exact format:
{
  "summary": "string describing what was done and the outcome",
  "nextActionItems": ["action 1", "action 2"],
  "hasNextActions": true/false
}`;

    console.log('Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful AI that generates task summaries for employee handovers. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const aiContent = data.choices[0]?.message?.content;
    
    if (!aiContent) {
      console.error('No content in OpenAI response');
      return new Response(
        JSON.stringify({ error: 'No content in AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let summary;
    try {
      // Clean up the response if it has markdown code blocks
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      summary = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, 'Content:', aiContent);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI summary generated successfully');

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-task-summary function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
