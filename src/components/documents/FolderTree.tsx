import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreVertical, FolderPlus, Edit, Trash2 } from "lucide-react";
import { ProjectFolder } from "@/hooks/useProjectFolders";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface FolderTreeProps {
  folders: ProjectFolder[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folder: ProjectFolder) => void;
  onDeleteFolder: (folderId: string) => void;
}

interface FolderNodeProps {
  folder: ProjectFolder;
  subfolders: ProjectFolder[];
  level: number;
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folder: ProjectFolder) => void;
  onDeleteFolder: (folderId: string) => void;
}

const FolderNode = ({
  folder,
  subfolders,
  level,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isSelected = selectedFolderId === folder.id;
  const hasChildren = subfolders.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer group",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="w-4" />
          )}
        </Button>

        <div
          className="flex items-center gap-2 flex-1 min-w-0"
          onClick={() => onFolderSelect(folder.id)}
        >
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-primary shrink-0" />
          )}
          <span className="text-sm truncate">{folder.name}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCreateFolder(folder.id)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Nova subpasta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRenameFolder(folder)}>
              <Edit className="h-4 w-4 mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteFolder(folder.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {subfolders.map((subfolder) => (
            <FolderNode
              key={subfolder.id}
              folder={subfolder}
              subfolders={subfolders.filter((f) => f.parent_folder_id === subfolder.id)}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onFolderSelect={onFolderSelect}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree = ({
  folders,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderTreeProps) => {
  const rootFolders = folders.filter((f) => !f.parent_folder_id);

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer",
          selectedFolderId === null && "bg-accent"
        )}
        onClick={() => onFolderSelect(null)}
      >
        <Folder className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Raiz</span>
      </div>

      {rootFolders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          subfolders={folders.filter((f) => f.parent_folder_id === folder.id)}
          level={0}
          selectedFolderId={selectedFolderId}
          onFolderSelect={onFolderSelect}
          onCreateFolder={onCreateFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
    </div>
  );
};
