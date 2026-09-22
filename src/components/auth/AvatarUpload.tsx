"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, Loader2, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { env } from "@/lib/env";

interface AvatarUploadProps {
  /** Called with the public ImgBB URL after successful upload, or null to clear */
  onUpload: (url: string | null) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}

async function uploadToImgBB(file: File): Promise<string> {
  const body = new FormData(); body.append("image", file);
  const res = await fetch(`${env.apiBaseUrl}/auth/avatar`, { method: "POST", body, signal: AbortSignal.timeout(35000) });
  const data = await res.json();
  if (!res.ok || !data.data?.url) throw new Error(data.message || "Image upload failed. Please try again.");
  return data.data.url;
}

/**
 * Circular avatar picker + ImgBB uploader for the registration form.
 */
export function AvatarUpload({ onUpload, disabled, onBusyChange }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  const handleFile = async (file: File) => {
    if (disabled || uploading) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("Image must be under 6 MB.");
      return;
    }
    setError(null);

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    onUpload(null);
    onBusyChange?.(true);
    setUploading(true);
    try {
      const url = await uploadToImgBB(file);
      onUpload(url);
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      onUpload(null);
    } finally {
      setUploading(false);
      onBusyChange?.(false);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  const clear = () => {
    setPreview(null);
    setError(null);
    onUpload(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {/* Circle avatar */}
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          aria-label="Upload profile photo"
          className={cn(
            "group relative h-20 w-20 overflow-hidden rounded-full border-2 transition-all",
            preview
              ? "border-violet-400/60 shadow-lg shadow-violet-500/20"
              : "border-dashed border-border hover:border-violet-400/60 hover:shadow-md hover:shadow-violet-500/10",
            "bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Avatar preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <User className="h-7 w-7" />
              <span className="text-[10px] font-medium">Photo</span>
            </span>
          )}

          {/* Hover overlay */}
          {!uploading && (
            <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
              <span className="mt-0.5 text-[10px] font-semibold text-white">
                {preview ? "Change" : "Upload"}
              </span>
            </span>
          )}

          {/* Uploading spinner */}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </span>
          )}
        </button>

        {/* Remove button */}
        {preview && !uploading && (
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            aria-label="Remove photo"
            className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-destructive text-white shadow transition hover:opacity-80"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {preview ? (uploading ? "Uploading…" : "Photo uploaded") : "Click or drag to add a profile photo"}
        <span className="block opacity-60">(optional · max 6 MB)</span>
      </p>

      {error && (
        <p className="text-center text-xs text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleChange}
        disabled={disabled || uploading}
        aria-hidden
      />
    </div>
  );
}
