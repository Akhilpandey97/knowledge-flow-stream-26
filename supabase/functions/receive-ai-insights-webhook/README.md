# Receive AI Insights Webhook

This Supabase Edge Function receives POST requests from Lindy.ai containing AI-generated insights after document analysis.

## Endpoint
`POST /functions/v1/receive-ai-insights-webhook`

## Request Format
```json
{
  "handover_id": "123e4567-e89b-12d3-a456-426614174000", // Required: UUID
  "insights": {                                           // Required: JSON object
    "summary": "AI analysis summary",
    "recommendations": ["rec1", "rec2"]
  },
  "user_id": "456e7890-e89b-12d3-a456-426614174001",     // Optional: UUID
  "file_path": "user1/document.pdf"                       // Optional: string
}
```

## Response Formats

### Success (200)
```json
{
  "success": true,
  "message": "AI insights received and stored successfully",
  "data": [/* inserted record */]
}
```

### Missing Required Fields (400)
```json
{
  "error": "Missing required fields: handover_id and insights are required"
}
```

### Method Not Allowed (405)
```json
{
  "error": "Method not allowed"
}
```

### Server Error (500)
```json
{
  "error": "Failed to insert AI insights",
  "details": "Database error details"
}
```

## Features
- ✅ CORS preflight (OPTIONS) support
- ✅ Request validation for required fields
- ✅ Inserts into `ai_knowledge_insights_complex` table
- ✅ Sets `created_at` to current timestamp
- ✅ Handles optional `user_id` and `file_path` fields
- ✅ Proper error handling and status codes
- ✅ Environment variable configuration

## Database Schema
The function inserts data into the `ai_knowledge_insights_complex` table with the following fields:
- `handover_id` (UUID, nullable, foreign key to handovers table)
- `insights` (JSON, required)
- `user_id` (UUID, nullable, foreign key to users table)
- `file_path` (string, nullable, foreign key to user_document_uploads table)
- `created_at` (timestamp, auto-generated)

## Environment Variables
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

## Testing
Use the provided test script in `/tmp/test-receive-ai-insights-webhook.sh` to test various scenarios.