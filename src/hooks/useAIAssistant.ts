import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProjectData {
  name: string;
  address: string;
  area: number;
  status: 'viability' | 'project' | 'approvals' | 'sales' | 'delivery';
  description: string;
  confidence?: string;
  extracted_data?: any;
}

export const useAIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ProjectData | null>(null);
  const { toast } = useToast();

  const sendMessage = useCallback(async (content: string, files?: File[]) => {
    try {
      setIsProcessing(true);

      // Add user message
      const userMessage: Message = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      // Upload files to temp storage if provided
      let fileUrls: string[] = [];
      if (files && files.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        for (const file of files) {
          const filePath = `${user.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('temp-ai-uploads')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('temp-ai-uploads')
            .getPublicUrl(filePath);

          fileUrls.push(publicUrl);
        }
      }

      // Call AI assistant
      const { data, error } = await supabase.functions.invoke('ai-project-assistant', {
        body: { 
          messages: [...messages, userMessage],
          fileUrls: fileUrls.length > 0 ? fileUrls : undefined
        }
      });

      if (error) throw error;

      const assistantResponse = data.response;
      
      // Add assistant response
      const assistantMessage: Message = { role: 'assistant', content: assistantResponse };
      setMessages(prev => [...prev, assistantMessage]);

      // Try to parse JSON from response
      try {
        const jsonMatch = assistantResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setExtractedData(parsed);
        }
      } catch (e) {
        console.log('Could not parse JSON from response:', e);
      }

      // Clean up temp files
      if (fileUrls.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          for (const url of fileUrls) {
            const fileName = url.split('/').pop();
            if (fileName) {
              await supabase.storage
                .from('temp-ai-uploads')
                .remove([`${user.id}/${fileName}`]);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao processar mensagem',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [messages, toast]);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64 }
      });

      if (error) throw error;
      return data.text || '';
    } catch (error: any) {
      console.error('Error transcribing audio:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao transcrever áudio',
        variant: 'destructive'
      });
      return '';
    }
  }, [toast]);

  const reset = useCallback(() => {
    setMessages([]);
    setExtractedData(null);
  }, []);

  return {
    messages,
    isProcessing,
    extractedData,
    sendMessage,
    transcribeAudio,
    reset
  };
};