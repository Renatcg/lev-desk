import { useState } from "react";
import { ProjectFolder } from "@/hooks/useProjectFolders";
import { ProjectDocument } from "@/hooks/useProjectDocuments";
import { EditableName } from "./EditableName";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Image,
  FileSpreadsheet,
  FileCode,
  File,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

interface FileExplorerTreeProps {
  folders: ProjectFolder[];
  documents: ProjectDocument[];
  selectedDocumentId: string | null;
  onDocumentSelect: (document: ProjectDocument) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onUploadDocument: (folderId: string | null) => void;
  onRenameDocument: (documentId: string, newName: string) => void;
  onDeleteDocument: (document: ProjectDocument) => void;
  onDownloadDocument: (document: ProjectDocument) => void;
  rootName: string;
}

interface TreeNodeProps {
  folder: ProjectFolder | null;
  folders: ProjectFolder[];
  documents: ProjectDocument[];
  level: number;
  selectedDocumentId: string | null;
  onDocumentSelect: (document: ProjectDocument) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onUploadDocument: (folderId: string | null) => void;
  onRenameDocument: (documentId: string, newName: string) => void;
  onDeleteDocument: (document: ProjectDocument) => void;
  onDownloadDocument: (document: ProjectDocument) => void;
  isRoot?: boolean;
  rootName?: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("code") || mimeType.includes("text/")) return FileCode;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  return File;
};

const TreeNode = ({
  folder,
  folders,
  documents,
  level,
  selectedDocumentId,
  onDocumentSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onUploadDocument,
  onRenameDocument,
  onDeleteDocument,
  onDownloadDocument,
  isRoot = false,
  rootName = "",
}: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const folderId = folder?.id || null;
  const childFolders = folders.filter((f) => f.parent_folder_id === folderId);
  const folderDocuments = documents.filter((d) => d.folder_id === folderId);

  const hasChildren = childFolders.length > 0 || folderDocuments.length > 0;
  const FolderIcon = isExpanded ? FolderOpen : Folder;

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "flex items-center gap-1 py-1 px-2 hover:bg-accent/50 rounded cursor-pointer group",
              isRoot && "font-semibold"
            )}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-0.5 hover:bg-accent rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            <FolderIcon className="h-4 w-4 text-primary flex-shrink-0" />
            {isRoot ? (
              <span className="text-sm">{rootName}</span>
            ) : folder ? (
              <EditableName
                value={folder.name}
                onSave={(newName) => onRenameFolder(folder.id, newName)}
                className="text-sm flex-1"
              />
            ) : null}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onCreateFolder(folderId)}>
            Nova Subpasta
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onUploadDocument(folderId)}>
            Upload Documento
          </ContextMenuItem>
          {!isRoot && folder && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                className="text-destructive"
                onClick={() => onDeleteFolder(folder.id)}
              >
                Excluir Pasta
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {isExpanded && (
        <div>
          {childFolders.map((childFolder) => (
            <TreeNode
              key={childFolder.id}
              folder={childFolder}
              folders={folders}
              documents={documents}
              level={level + 1}
              selectedDocumentId={selectedDocumentId}
              onDocumentSelect={onDocumentSelect}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onUploadDocument={onUploadDocument}
              onRenameDocument={onRenameDocument}
              onDeleteDocument={onDeleteDocument}
              onDownloadDocument={onDownloadDocument}
            />
          ))}

          {folderDocuments.map((doc) => {
            const FileIcon = getFileIcon(doc.mime_type);
            return (
              <ContextMenu key={doc.id}>
                <ContextMenuTrigger>
                  <div
                    className={cn(
                      "flex items-center gap-1 py-1 px-2 hover:bg-accent/50 rounded cursor-pointer group",
                      selectedDocumentId === doc.id && "bg-accent"
                    )}
                    style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                    onClick={() => onDocumentSelect(doc)}
                  >
                    <div className="w-5" />
                    <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <EditableName
                      value={doc.name}
                      onSave={(newName) => onRenameDocument(doc.id, newName)}
                      className="text-sm flex-1 truncate"
                    />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onDocumentSelect(doc)}>
                    Visualizar
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onDownloadDocument(doc)}>
                    Baixar
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    className="text-destructive"
                    onClick={() => onDeleteDocument(doc)}
                  >
                    Excluir
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const FileExplorerTree = ({
  folders,
  documents,
  selectedDocumentId,
  onDocumentSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onUploadDocument,
  onRenameDocument,
  onDeleteDocument,
  onDownloadDocument,
  rootName,
}: FileExplorerTreeProps) => {
  return (
    <div className="w-full">
      <TreeNode
        folder={null}
        folders={folders}
        documents={documents}
        level={0}
        selectedDocumentId={selectedDocumentId}
        onDocumentSelect={onDocumentSelect}
        onCreateFolder={onCreateFolder}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
        onUploadDocument={onUploadDocument}
        onRenameDocument={onRenameDocument}
        onDeleteDocument={onDeleteDocument}
        onDownloadDocument={onDownloadDocument}
        isRoot
        rootName={rootName}
      />
    </div>
  );
};
