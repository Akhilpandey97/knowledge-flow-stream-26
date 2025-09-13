-- Create storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('handover-documents', 'handover-documents', false);

-- Create policies for document uploads
CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'handover-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'handover-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table to track document upload status
CREATE TABLE public.user_document_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  webhook_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_document_uploads
ALTER TABLE public.user_document_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for user_document_uploads
CREATE POLICY "Users can view their own document uploads" 
ON public.user_document_uploads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own document uploads" 
ON public.user_document_uploads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);