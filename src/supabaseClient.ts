import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://leplvqapnexpgmivfdpl.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlcGx2cWFwbmV4cGdtaXZmZHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTg2NjksImV4cCI6MjA3MjkzNDY2OX0.hQMYkofgPxwnfUIX3j7FBzKjDarka8jIHB9XW-QBvTQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);