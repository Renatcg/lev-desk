import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Image as ImageIcon, FileIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Documents() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      for (const file of Array.from(files)) {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('company-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save document metadata
        const { error: dbError } = await supabase.from('documents').insert({
          name: file.name,
          file_path: filePath,
          bucket_name: 'company-documents',
          mime_type: file.type,
          size: file.size,
          uploaded_by: user.id
        });

        if (dbError) throw dbError;
      }

      toast({
        title: 'Sucesso',
        description: 'Documentos enviados com sucesso!'
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar documentos',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Documentos</h1>
        <p className="text-muted-foreground">
          Gerencie documentos de projetos, terrenos e empresas
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload de Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept="image/*,application/pdf,.doc,.docx"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Clique para fazer upload
                </p>
                <p className="text-sm text-muted-foreground">
                  Suporta: PDF, Imagens, Word
                </p>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <FileText className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Documentos de Projetos</h3>
              <p className="text-sm text-muted-foreground">
                Plantas, aprovações, contratos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <ImageIcon className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Fotos de Terrenos</h3>
              <p className="text-sm text-muted-foreground">
                Imagens e levantamentos topográficos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FileIcon className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Documentos Corporativos</h3>
              <p className="text-sm text-muted-foreground">
                Contratos, CNPJs, licenças
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}