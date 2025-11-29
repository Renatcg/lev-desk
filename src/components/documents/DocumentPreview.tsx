import { useEffect, useState } from "react";
import { ProjectDocument } from "@/hooks/useProjectDocuments";
import { Button } from "@/components/ui/button";
import { Download, Maximize2, X, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentPreviewProps {
  document: ProjectDocument | null;
  documentUrl: string | null;
  onClose: () => void;
  onDownload: (document: ProjectDocument) => void;
  onMaximize: (document: ProjectDocument) => void;
}

export const DocumentPreview = ({
  document,
  documentUrl,
  onClose,
  onDownload,
  onMaximize,
}: DocumentPreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Só mostra loading se não tiver URL ainda
    if (!documentUrl) {
      setIsLoading(true);
    }
  }, [document?.id, documentUrl]);

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <FileText className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-sm">Selecione um documento para visualizar</p>
      </div>
    );
  }

  const renderPreview = () => {
    if (!documentUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <Skeleton className="w-full h-full" />
        </div>
      );
    }

    const isImage = document.mime_type.startsWith("image/");
    const isPdf = document.mime_type.includes("pdf");
    const isVideo = document.mime_type.startsWith("video/");
    const isAudio = document.mime_type.startsWith("audio/");

    if (isImage) {
      return (
        <img
          src={documentUrl}
          alt={document.name}
          className="w-full h-full object-contain"
          onLoad={() => setIsLoading(false)}
        />
      );
    }

    if (isPdf) {
      return (
        <iframe
          src={documentUrl}
          className="w-full h-full border-0"
          title={document.name}
          onLoad={() => setIsLoading(false)}
        />
      );
    }

    if (isVideo) {
      return (
        <video
          src={documentUrl}
          controls
          className="w-full h-full"
          onLoadedData={() => setIsLoading(false)}
        >
          Seu navegador não suporta reprodução de vídeo.
        </video>
      );
    }

    if (isAudio) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <audio
            src={documentUrl}
            controls
            className="w-full max-w-md"
            onLoadedData={() => setIsLoading(false)}
          >
            Seu navegador não suporta reprodução de áudio.
          </audio>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <FileText className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-sm mb-4">Preview não disponível para este tipo de arquivo</p>
        <Button onClick={() => onDownload(document)}>
          <Download className="h-4 w-4 mr-2" />
          Baixar documento
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{document.name}</h3>
          {document.description && (
            <p className="text-sm text-muted-foreground truncate">
              {document.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDownload(document)}
            title="Baixar"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMaximize(document)}
            title="Tela cheia"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} title="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        {renderPreview()}
      </div>
    </div>
  );
};
