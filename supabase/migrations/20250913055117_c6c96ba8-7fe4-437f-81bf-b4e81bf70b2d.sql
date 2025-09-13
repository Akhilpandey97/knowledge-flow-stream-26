-- Enable Row Level Security on users table (CRITICAL SECURITY FIX)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;