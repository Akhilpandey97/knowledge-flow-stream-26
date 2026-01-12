import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { handoverId, tasks, exitingEmployeeName, department } = await req.json();
    
    console.log('Generating AI insights for handover:', handoverId);
    console.log('Tasks count:', tasks?.length || 0);

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare task summary for AI analysis
    const taskSummary = tasks?.map((task: any) => ({
      title: task.title,
      status: task.status,
      priority: task.priority,
      category: task.category,
      notes: task.notes || '',
      description: task.description || ''
    })) || [];

    const completedTasks = taskSummary.filter((t: any) => t.status === 'completed');
    const pendingTasks = taskSummary.filter((t: any) => t.status !== 'completed');
    const criticalTasks = taskSummary.filter((t: any) => t.priority === 'critical' || t.priority === 'high');

    const prompt = `You are an AI assistant analyzing a knowledge transfer handover from an exiting employee to their successor.

HANDOVER CONTEXT:
- Exiting Employee: ${exitingEmployeeName || 'Unknown'}
- Department: ${department || 'General'}
- Total Tasks: ${taskSummary.length}
- Completed Tasks: ${completedTasks.length}
- Pending Tasks: ${pendingTasks.length}
- Critical/High Priority Tasks: ${criticalTasks.length}

TASK DETAILS:
${JSON.stringify(taskSummary, null, 2)}

Based on this handover data, generate actionable AI insights in the following JSON format:

{
  "revenueInsights": [
    {
      "metric": "Key Business Metric",
      "value": "Quantified value or percentage",
      "insight": "Actionable insight about revenue impact"
    }
  ],
  "playbookActions": [
    {
      "title": "Action Item Title",
      "detail": "Specific action with timeline or impact"
    }
  ],
  "criticalItems": [
    {
      "title": "Critical Issue Title",
      "insight": "Why this is critical and recommended action"
    }
  ]
}

INSTRUCTIONS:
1. Generate 3 revenue/business insights based on the handover tasks
2. Generate 3 actionable playbook items for the successor
3. Generate 3 critical/priority items that need immediate attention
4. Make insights specific to the actual task titles and categories provided
5. If there are client-related tasks, mention specific client insights
6. Focus on knowledge gaps, risks, and opportunities from the task data
7. Be specific and actionable - avoid generic advice

Return ONLY valid JSON, no additional text.`;

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
            content: 'You are a business analyst AI that generates actionable insights from handover data. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
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
    let insights;
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
      insights = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, 'Content:', aiContent);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI insights generated successfully');

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ai-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
