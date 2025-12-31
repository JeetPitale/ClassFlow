import { useCallback, useState } from 'react';
import { Upload, X, FileText, Image, Music, Video, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';









const getFileIcon = (type) => {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('audio/')) return Music;
  if (type.startsWith('video/')) return Video;
  if (type.includes('pdf') || type.includes('document')) return FileText;
  return File;
};

export function FileUpload({
  accept,
  multiple = false,
  maxSize = 10,
  onFilesSelected,
  className
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);

  const validateFile = useCallback((file) => {
    if (!accept) return true;

    const acceptedTypes = accept.split(',').map(type => type.trim());
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    return acceptedTypes.some(type => {
      // Check for MIME types (e.g. image/jpeg)
      if (type.includes('/')) {
        if (type.endsWith('/*')) {
          // Handle wildcards like image/*
          const mainType = type.split('/')[0];
          return fileType.startsWith(`${mainType}/`);
        }
        return fileType === type;
      }
      // Check for extensions (e.g. .pdf)
      if (type.startsWith('.')) {
        return fileName.endsWith(type.toLowerCase());
      }
      return false;
    });
  }, [accept]);

  const handleFiles = useCallback(
    (files) => {
      if (!files) return;

      const fileArray = Array.from(files);
      const validFiles = [];
      const invalidTypeFiles = [];

      for (const file of fileArray) {
        if (file.size > maxSize * 1024 * 1024) {
          setError(`File "${file.name}" exceeds ${maxSize}MB limit`);
          return;
        }

        if (!validateFile(file)) {
          invalidTypeFiles.push(file.name);
          continue; // Skip this file
        }

        validFiles.push(file);
      }

      if (invalidTypeFiles.length > 0) {
        setError(`Invalid file type: ${invalidTypeFiles.join(', ')}. Expected: ${accept}`);
        // If we want to strictly fail all if one is bad, we'd return here. 
        // But usually it's better to just show error and maybe not add any, or add valid ones.
        // Let's stop if there are invalid files to force user to correct.
        return;
      }

      setError(null);
      const newFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [maxSize, multiple, selectedFiles, onFilesSelected, validateFile, accept]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors',
          isDragging ?
            'border-primary bg-primary/5' :
            'border-border hover:border-primary/50 hover:bg-muted/50'
        )}>

        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-foreground font-medium mb-1">
          Drag & drop files here
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          or click to browse (max {maxSize}MB)
        </p>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="file-upload" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('file-upload')?.click()}>

          Browse Files
        </Button>
      </div>

      {error &&
        <p className="text-sm text-destructive">{error}</p>
      }

      {selectedFiles.length > 0 &&
        <div className="space-y-2">
          {selectedFiles.map((file, index) => {
            const Icon = getFileIcon(file.type);
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">

                <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 rounded hover:bg-muted transition-colors">

                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>);

          })}
        </div>
      }
    </div>);

}