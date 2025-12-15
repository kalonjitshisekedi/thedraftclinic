import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/utils";

interface UploadedFile {
  file: File;
  progress: number;
  wordCount?: number;
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
}

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  onWordCountCalculated?: (wordCount: number) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedFormats?: string[];
}

const DEFAULT_ACCEPTED_FORMATS = [
  ".doc",
  ".docx",
  ".pdf",
  ".txt",
  ".rtf",
  ".odt",
];

export function FileUpload({
  onFilesChange,
  onWordCountCalculated,
  maxFiles = 5,
  maxSize = 50 * 1024 * 1024,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
      onFilesChange(acceptedFiles);

      newFiles.forEach((uploadedFile, index) => {
        const progress = setInterval(() => {
          setUploadedFiles((prev) =>
            prev.map((f, i) => {
              if (i === prev.length - newFiles.length + index) {
                const newProgress = Math.min(f.progress + 20, 100);
                if (newProgress === 100) {
                  clearInterval(progress);
                  setTimeout(() => {
                    setUploadedFiles((prev) =>
                      prev.map((f, j) => {
                        if (j === prev.length - newFiles.length + index) {
                          const estimatedWords = Math.round(f.file.size / 6);
                          onWordCountCalculated?.(estimatedWords);
                          return {
                            ...f,
                            status: "complete" as const,
                            wordCount: estimatedWords,
                          };
                        }
                        return f;
                      })
                    );
                  }, 500);
                  return { ...f, progress: newProgress, status: "processing" as const };
                }
                return { ...f, progress: newProgress };
              }
              return f;
            })
          );
        }, 200);
      });
    },
    [maxFiles, onFilesChange, onWordCountCalculated]
  );

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    const remainingFiles = uploadedFiles.filter((_, i) => i !== index).map((f) => f.file);
    onFilesChange(remainingFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - uploadedFiles.length,
    maxSize,
    accept: acceptedFormats.reduce((acc, format) => {
      const mimeTypes: Record<string, string[]> = {
        ".doc": ["application/msword"],
        ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        ".pdf": ["application/pdf"],
        ".txt": ["text/plain"],
        ".rtf": ["application/rtf"],
        ".odt": ["application/vnd.oasis.opendocument.text"],
      };
      return { ...acc, ...mimeTypes[format]?.reduce((a, m) => ({ ...a, [m]: [format] }), {}) };
    }, {}),
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        data-testid="dropzone-file-upload"
      >
        <input {...getInputProps()} data-testid="input-file-upload" />
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-muted rounded-full">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">
              {isDragActive ? "Drop your files here" : "Drag & drop your document"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse files
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>Supported formats: {acceptedFormats.join(", ")}</p>
            <p>Maximum file size: {formatFileSize(maxSize)}</p>
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((uploadedFile, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-md"
              data-testid={`file-item-${index}`}
            >
              <FileText className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{uploadedFile.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadedFile.file.size)}
                  {uploadedFile.wordCount && ` • ~${uploadedFile.wordCount.toLocaleString()} words`}
                </p>
                {uploadedFile.status === "uploading" && (
                  <Progress value={uploadedFile.progress} className="h-1 mt-2" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {uploadedFile.status === "uploading" && (
                  <span className="text-xs text-muted-foreground">{uploadedFile.progress}%</span>
                )}
                {uploadedFile.status === "processing" && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {uploadedFile.status === "complete" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  data-testid={`button-remove-file-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
