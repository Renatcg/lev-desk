import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableNameProps {
  value: string;
  onSave: (newName: string) => void;
  className?: string;
  startInEditMode?: boolean;
  onCancel?: () => void;
}

export const EditableName = ({ value, onSave, className, startInEditMode = false, onCancel }: EditableNameProps) => {
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
    setEditValue(value);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn("h-6 py-0 px-1 text-sm", className)}
      />
    );
  }

  return (
    <span
      onDoubleClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-accent/50 rounded px-1 transition-colors",
        className
      )}
    >
      {value}
    </span>
  );
};
