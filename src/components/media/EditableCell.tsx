import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditableCellProps {
  value: any;
  field: string;
  type: 'text' | 'number' | 'select' | 'date';
  isEditing: boolean;
  onEdit: () => void;
  onChange: (value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export function EditableCell({
  value,
  field,
  type,
  isEditing,
  onEdit,
  onChange,
  onSave,
  onCancel,
  options = [],
  placeholder = '',
  className = ''
}: EditableCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onChange(localValue);
      onSave();
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      onCancel();
    } else if (e.key === 'Tab') {
      onChange(localValue);
      onSave();
    }
  };

  const handleBlur = () => {
    onChange(localValue);
    onSave();
  };

  if (!isEditing) {
    return (
      <div 
        onClick={onEdit}
        className={cn(
          "cursor-pointer hover:bg-muted/50 p-2 h-full flex items-center rounded transition-colors",
          className
        )}
      >
        {type === 'date' && value ? format(new Date(value), 'dd/MM/yyyy') : (value || '-')}
      </div>
    );
  }

  switch (type) {
    case 'select':
      return (
        <Select 
          value={localValue} 
          onValueChange={(val) => {
            setLocalValue(val);
            onChange(val);
            onSave();
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'date':
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-8 justify-start text-left font-normal text-sm",
                !localValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {localValue ? format(new Date(localValue), "dd/MM/yyyy") : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={localValue ? new Date(localValue) : undefined}
              onSelect={(date) => {
                if (date) {
                  const formatted = format(date, 'yyyy-MM-dd');
                  setLocalValue(formatted);
                  onChange(formatted);
                  onSave();
                }
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      );

    case 'number':
      return (
        <Input
          ref={inputRef}
          type="number"
          step="0.01"
          value={localValue || ''}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-8 text-sm"
          placeholder={placeholder}
        />
      );

    default:
      return (
        <Input
          ref={inputRef}
          type="text"
          value={localValue || ''}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-8 text-sm"
          placeholder={placeholder}
        />
      );
  }
}
