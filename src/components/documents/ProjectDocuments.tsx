import { useState, useEffect } from "react";
import { FolderTree } from "./FolderTree";
import { DocumentList } from "./DocumentList";
import { DocumentPreview } from "./DocumentPreview";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { useProjectFolders, ProjectFolder } from "@/hooks/useProjectFolders";
import { useProjectDocuments, ProjectDocument } from "@/hooks/useProjectDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderPlus, Upload, SidebarClose, SidebarOpen, Search } from "lucide-react";
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
}

export const ProjectDocuments = ({ projectId }: ProjectDocumentsProps) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "folder" | "document"; id: string } | null>(null);
  const [fullscreenDocument, setFullscreenDocument] = useState<ProjectDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { folders, isLoading: foldersLoading, createFolder, deleteFolder } = useProjectFolders(projectId);
  const { documents, isLoading: documentsLoading, uploadDocument, deleteDocument, getDocumentUrl, downloadDocument } = useProjectDocuments(projectId, selectedFolderId);

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

  const handleDeleteFolder = (folderId: string) => {
    setItemToDelete({ type: "folder", id: folderId });
    setDeleteDialogOpen(true);
  };

  const handleDeleteDocument = (document: ProjectDocument) => {
    setItemToDelete({ type: "document", id: document.id });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "folder") {
      deleteFolder.mutate(itemToDelete.id);
    } else {
      const doc = documents.find((d) => d.id === itemToDelete.id);
      if (doc) deleteDocument.mutate(doc);
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
      folderId: selectedFolderId,
      description,
    });
    setUploadDialogOpen(false);
  };

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  const filteredDocuments = searchQuery
    ? documents.filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : documents;

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-lg font-semibold">Documentos do Projeto</h2>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleCreateFolder(selectedFolderId)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Nova pasta
          </Button>
          <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <SidebarClose className="h-4 w-4" /> : <SidebarOpen className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-full overflow-auto p-4">
            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onFolderSelect={setSelectedFolderId}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={(folder) => {}}
              onDeleteFolder={handleDeleteFolder}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={showPreview ? 50 : 80}>
          <div className="h-full overflow-auto">
            <DocumentList
              documents={filteredDocuments}
              onDocumentSelect={handleDocumentSelect}
              onDocumentDownload={downloadDocument}
              onDocumentDelete={handleDeleteDocument}
              selectedDocumentId={selectedDocument?.id || null}
            />
          </div>
        </ResizablePanel>

        {showPreview && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
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
        parentFolderName={selectedFolder?.name}
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
