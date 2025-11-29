import { useState } from "react";
import FileUpload from "./components/FileUpload";
import PreviewGrid from "./components/PreviewGrid";
import SceneList from "./components/SceneList";
import Modal from "./components/Modal";
import PanoramaViewer from "./components/PanoramaViewer";

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const open360 = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Virtual Tour Generator</h1>

      <FileUpload onSelect={(f) => setFiles(f)} />

      {/* Scene list */}
      {files.length > 0 && (
        <SceneList files={files} onSelect={open360} />
      )}

      {/* File preview grid */}
      <PreviewGrid files={files} onOpen360={open360} />

      {/* 360 Modal */}
      <Modal open={!!selectedFile} onClose={() => setSelectedFile(null)}>
        <h2>{selectedFile?.name}</h2>
        <PanoramaViewer imageUrl={previewUrl} />
      </Modal>
    </div>
  );
}

export default App;
