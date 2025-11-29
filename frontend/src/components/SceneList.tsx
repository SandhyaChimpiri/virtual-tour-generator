interface Props {
  files: File[];
  onSelect: (file: File) => void;
}

export default function SceneList({ files, onSelect }: Props) {
  return (
    <div>
      <h3>Scenes</h3>
      <ul style={{ paddingLeft: 0, listStyle: "none" }}>
        {files.map((file, i) => (
          <li
            key={i}
            onClick={() => onSelect(file)}
            style={{
              padding: "8px 12px",
              marginBottom: "8px",
              background: "#eee",
              cursor: "pointer",
              borderRadius: "5px",
            }}
          >
            {file.name.replace(/\.(jpg|jpeg|png)$/i, "")}
          </li>
        ))}
      </ul>
    </div>
  );
}
