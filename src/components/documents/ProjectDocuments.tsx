import { useState, useEffect } from "react";
import { FileExplorerTree } from "./FileExplorerTree";
import { DocumentPreview } from "./DocumentPreview";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { useProjectFolders } from "@/hooks/useProjectFolders";
import { useProjectDocuments, ProjectDocument } from "@/hooks/useProjectDocuments";
import { Button } from "@/components/ui/button";
import { SidebarClose, SidebarOpen } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProjectDocumentsProps {
  projectId: string;
  projectName: string;
}

export const ProjectDocuments = ({ projectId, projectName }: ProjectDocumentsProps) => {
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "folder" | "document"; id: string; data?: any } | null>(null);
  const [fullscreenDocument, setFullscreenDocument] = useState<ProjectDocument | null>(null);

  const { folders, createFolder, updateFolder, deleteFolder } = useProjectFolders(projectId);
  const { documents, uploadDocument, updateDocument, deleteDocument, getDocumentUrl, downloadDocument } = useProjectDocuments(projectId);

  useEffect(() => {
    if (selectedDocument) {
      getDocumentUrl(selectedDocument).then(setDocumentUrl);
    } else {
      setDocumentUrl(null);
    }
  }, [selectedDocument?.id]);

  const handleCreateFolder = (parentId: string | null) => {
    setParentFolderId(parentId);
    setCreateFolderOpen(true);
  };

  const handleFolderCreated = (name: string, description?: string) => {
    createFolder.mutate({
      name,
      description,
      parent_folder_id: parentFolderId,
    });
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    updateFolder.mutate({ id: folderId, updates: { name: newName } });
  };

  const handleDeleteFolder = (folderId: string) => {
    setItemToDelete({ type: "folder", id: folderId });
    setDeleteDialogOpen(true);
  };

  const handleRenameDocument = (documentId: string, newName: string) => {
    updateDocument.mutate({ id: documentId, updates: { name: newName } });
  };

  const handleDeleteDocument = (document: ProjectDocument) => {
    setItemToDelete({ type: "document", id: document.id, data: document });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "folder") {
      deleteFolder.mutate(itemToDelete.id);
    } else if (itemToDelete.data) {
      deleteDocument.mutate(itemToDelete.data);
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDocumentSelect = (document: ProjectDocument) => {
    setSelectedDocument(document);
    if (!showPreview) setShowPreview(true);
  };

  const handleUploadDocument = (file: File, description?: string) => {
    uploadDocument.mutate({
      file,
      folderId: uploadFolderId,
      description,
    });
    setUploadDialogOpen(false);
  };

  const handleUploadClick = (folderId: string | null) => {
    setUploadFolderId(folderId);
    setUploadDialogOpen(true);
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-end p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? <SidebarClose className="h-4 w-4" /> : <SidebarOpen className="h-4 w-4" />}
        </Button>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={showPreview ? 60 : 100} minSize={30}>
          <div className="h-full overflow-auto p-4">
            <FileExplorerTree
              folders={folders}
              documents={documents}
              selectedDocumentId={selectedDocument?.id || null}
              onDocumentSelect={handleDocumentSelect}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onUploadDocument={handleUploadClick}
              onRenameDocument={handleRenameDocument}
              onDeleteDocument={handleDeleteDocument}
              onDownloadDocument={downloadDocument}
              rootName={`Docs ${projectName}`}
            />
          </div>
        </ResizablePanel>

        {showPreview && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40} minSize={20} maxSize={70}>
              <DocumentPreview
                document={selectedDocument}
                documentUrl={documentUrl}
                onClose={() => setSelectedDocument(null)}
                onDownload={(doc) => downloadDocument(doc)}
                onMaximize={setFullscreenDocument}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreateFolder={handleFolderCreated}
      />

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUploadDocument}
        isUploading={uploadDocument.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === "folder"
                ? "Tem certeza que deseja excluir esta pasta? Todos os documentos e subpastas serão excluídos."
                : "Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {fullscreenDocument && documentUrl && (
        <Dialog open={!!fullscreenDocument} onOpenChange={() => setFullscreenDocument(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
            <DocumentPreview
              document={fullscreenDocument}
              documentUrl={documentUrl}
              onClose={() => setFullscreenDocument(null)}
              onDownload={(doc) => downloadDocument(doc)}
              onMaximize={() => {}}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
