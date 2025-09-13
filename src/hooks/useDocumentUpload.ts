import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useDocumentUpload = () => {
  const { user } = useAuth();
  const [hasUploadedDocument, setHasUploadedDocument] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDocumentUpload = async () => {
      if (!user) {
        setHasUploadedDocument(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_document_uploads')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (error) {
          throw error;
        }

        setHasUploadedDocument(data && data.length > 0);
      } catch (err: any) {
        setError(err.message);
        setHasUploadedDocument(false);
      } finally {
        setLoading(false);
      }
    };

    checkDocumentUpload();
  }, [user]);

  const markDocumentUploaded = () => {
    setHasUploadedDocument(true);
  };

  return {
    hasUploadedDocument,
    loading,
    error,
    markDocumentUploaded
  };
};