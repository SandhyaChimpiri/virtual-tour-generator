interface PreviewProps {
  files: File[];
  onOpen360: (file: File) => void;
}

export default function PreviewGrid({ files, onOpen360 }: PreviewProps) {
  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
      {files.map((file, i) => {
        const url = URL.createObjectURL(file);
        const isImage = file.type.startsWith("image/");

        return (
          <div key={i} style={{ width: "150px", border: "1px solid #ddd", padding: "10px", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px" }}>{file.name}</p>

            {isImage ? (
              <>
                <img src={url} width="100%" style={{ borderRadius: "5px" }} />
                <button
                  onClick={() => onOpen360(file)}
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    background: "#2196F3",
                    color: "white",
                    padding: "6px",
                    borderRadius: "5px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  View 360°
                </button>
              </>
            ) : (
              <p>JSON File</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
