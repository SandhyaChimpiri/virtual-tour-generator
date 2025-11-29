import axios from "axios";

const BASE = "http://localhost:5000/api/files";

export async function processAndPackageFiles(
  files: File[],
  packageId?: string,
  packageName?: string,
  onProgress?: (percent: number) => void
) {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  if (packageId) formData.append("packageId", packageId);
  if (packageName) formData.append("packageName", packageName);

  const res = await axios.post(`${BASE}/process-package`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      const total = (event as any).total ?? 0;
      const loaded = (event as any).loaded ?? 0;
      if (total > 0 && onProgress) {
        const percent = Math.round((loaded * 100) / total);
        onProgress(percent);
      }
    },
  });

  return res.data;
}
