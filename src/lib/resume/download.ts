export type DownloadableExport = {
  presignedUrl?: string;
  base64?: string;
  fileName?: string;
  contentType?: string;
};

/** Download a resume whether the API stored it remotely or returned bytes. */
export function downloadResumeExport(
  result: DownloadableExport,
  fallbackName: string,
): boolean {
  if (result.base64) {
    const binary = window.atob(result.base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    const url = URL.createObjectURL(
      new Blob([bytes], {
        type: result.contentType ?? "application/octet-stream",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.fileName ?? fallbackName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    return true;
  }

  if (result.presignedUrl) {
    window.open(result.presignedUrl, "_blank", "noopener,noreferrer");
    return true;
  }

  return false;
}
