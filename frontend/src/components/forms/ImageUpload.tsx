import { useCallback, useRef, useState } from "react";
import { fileToBase64, formatBytes } from "@/lib/image";

interface ImageUploadProps {
  onImageReady: (base64: string) => void;
  onClear: () => void;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export default function ImageUpload({ onImageReady, onClear }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      setError("");

      if (!ACCEPTED.includes(file.type)) {
        setError("Please upload a JPEG, PNG, or WebP image.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Image must be under 10 MB.");
        return;
      }

      setProcessing(true);
      try {
        const base64 = await fileToBase64(file);
        setPreview(URL.createObjectURL(file));
        setFileName(file.name);
        setFileSize(file.size);
        onImageReady(base64);
      } catch {
        setError("Failed to process image. Please try another file.");
      } finally {
        setProcessing(false);
      }
    },
    [onImageReady]
  );

  const handleFile = (files: FileList | null) => {
    if (files?.[0]) processFile(files[0]);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFile(e.dataTransfer.files);
    },
    [processFile] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleClear = () => {
    setPreview(null);
    setFileName("");
    setFileSize(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    onClear();
  };

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-green-200 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt="Crop preview"
          className="w-full max-h-64 object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-end justify-between">
          <div className="text-white text-sm">
            <p className="font-medium truncate max-w-[180px]">{fileName}</p>
            <p className="text-xs text-white/70">{formatBytes(fileSize)}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 transition-colors"
            aria-label="Remove image"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-8
          flex flex-col items-center justify-center gap-3 transition-colors
          ${dragging
            ? "border-green-500 bg-green-50"
            : "border-green-200 bg-white hover:border-green-400 hover:bg-green-50"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => handleFile(e.target.files)}
        />

        {processing ? (
          <div className="flex flex-col items-center gap-2 text-green-600">
            <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm font-medium">Processing image…</span>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl">
              📷
            </div>
            <div className="text-center">
              <p className="font-medium text-green-800">
                Drop your crop photo here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or <span className="text-green-600 underline underline-offset-2">browse files</span>
              </p>
            </div>
            <p className="text-xs text-gray-400">JPEG, PNG, WebP · max 10 MB</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1.5">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
