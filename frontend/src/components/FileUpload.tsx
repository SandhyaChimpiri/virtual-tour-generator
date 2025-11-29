import { useRef } from "react";

interface UploadProps {
  onSelect: (files: File[]) => void;
}

export default function FileUpload({ onSelect }: UploadProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      <button
        onClick={() => fileRef.current?.click()}
        style={{
          padding: "10px 20px",
          background: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Select Files
      </button>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.json"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files) {
            onSelect(Array.from(e.target.files));
          }
        }}
      />
    </div>
  );
}
