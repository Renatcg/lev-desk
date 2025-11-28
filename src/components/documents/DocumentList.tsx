import { FileText, Download, Trash2, Eye, MoreVertical } from "lucide-react";
import { ProjectDocument } from "@/hooks/useProjectDocuments";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DocumentListProps {
  documents: ProjectDocument[];
  onDocumentSelect: (document: ProjectDocument) => void;
  onDocumentDownload: (document: ProjectDocument) => void;
  onDocumentDelete: (document: ProjectDocument) => void;
  selectedDocumentId: string | null;
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "📽️";
  return "📎";
};

export const DocumentList = ({
  documents,
  onDocumentSelect,
  onDocumentDownload,
  onDocumentDelete,
  selectedDocumentId,
}: DocumentListProps) => {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Nenhum documento nesta pasta</p>
        <p className="text-xs mt-2">Arraste arquivos aqui para fazer upload</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className={`flex items-center gap-3 p-3 hover:bg-accent cursor-pointer group ${
            selectedDocumentId === doc.id ? "bg-accent" : ""
          }`}
          onClick={() => onDocumentSelect(doc)}
        >
          <div className="text-2xl shrink-0">{getFileIcon(doc.mime_type)}</div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{doc.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatFileSize(doc.size)}</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(doc.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDocumentSelect(doc)}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDocumentDownload(doc)}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDocumentDelete(doc)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
};
