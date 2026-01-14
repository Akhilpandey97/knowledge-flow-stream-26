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
    const { handoverId, tasks, exitingEmployeeName, department, configuredTitles } = await req.json();
    
    console.log('Generating AI insights for handover:', handoverId);
    console.log('Tasks count:', tasks?.length || 0);
    console.log('Configured titles:', configuredTitles);

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get configured titles or use defaults
    const revenueTitle = configuredTitles?.revenueTitle || 'Hot Deals';
    const playbookTitle = configuredTitles?.playbookTitle || 'Deals you can miss';
    const criticalTitle = configuredTitles?.criticalTitle || 'Action Items for next 30 days';

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

    const prompt = `You are a Sales Intelligence AI analyzing a knowledge transfer handover from an exiting sales employee to their successor.

HANDOVER CONTEXT:
- Exiting Employee: ${exitingEmployeeName || 'Unknown'}
- Department: ${department || 'Sales'}
- Total Tasks: ${taskSummary.length}
- Completed Tasks: ${completedTasks.length}
- Pending Tasks: ${pendingTasks.length}
- Critical/High Priority Tasks: ${criticalTasks.length}

TASK DETAILS:
${JSON.stringify(taskSummary, null, 2)}

Generate insights that STRICTLY match the context of these section titles:

SECTION 1: "${revenueTitle}"
- This section is about HIGH-VALUE sales opportunities that are HOT and ready to close
- Focus on deals with high revenue potential, warm leads, accounts ready for upsell
- Include deal values, client names from tasks, and urgency indicators
- These are opportunities the successor should prioritize immediately

SECTION 2: "${playbookTitle}"  
- This section is about LOWER PRIORITY deals that can be deprioritized or skipped
- Focus on deals with lower value, cold leads, or accounts that need long nurturing
- Explain why these can wait or be given less attention
- Help successor focus energy on high-value opportunities first

SECTION 3: "${criticalTitle}"
- This section is about SPECIFIC ACTION ITEMS for the next 30 days
- Each item must have a clear deadline or timeframe within 30 days
- Include concrete next steps like "Schedule call with X by Week 2", "Send proposal to Y by Day 10"
- Focus on preventing revenue loss and maintaining client relationships

Based on this handover data, generate actionable AI insights in the following JSON format:

{
  "revenueInsights": [
    {
      "metric": "Deal or Opportunity Name",
      "value": "Estimated deal value or revenue impact",
      "insight": "Why this is a hot deal that needs immediate attention - include client context"
    }
  ],
  "playbookActions": [
    {
      "title": "Deal or Account Name",
      "detail": "Why this deal can be deprioritized - lower value, long sales cycle, or cold lead"
    }
  ],
  "criticalItems": [
    {
      "title": "Specific Action Item with Deadline",
      "insight": "What needs to be done in next 30 days and why - be specific about week/day"
    }
  ]
}

INSTRUCTIONS:
1. Generate 3 insights for "${revenueTitle}" - focus on HOT, high-value opportunities ready to close
2. Generate 3 items for "${playbookTitle}" - focus on deals that CAN BE DEPRIORITIZED
3. Generate 3 items for "${criticalTitle}" - focus on SPECIFIC 30-day action items with deadlines
4. Use actual task titles, client names, and account details from the provided data
5. If tasks mention specific clients or accounts, reference them by name
6. Be specific with numbers, dates, and values where possible
7. Each section must clearly match its title context - hot deals vs skippable deals vs action items

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
