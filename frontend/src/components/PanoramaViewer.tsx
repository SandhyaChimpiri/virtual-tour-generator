import { useEffect, useRef } from "react";

interface Props {
  imageUrl: string;
}

declare const pannellum: any;

export default function PanoramaViewer({ imageUrl }: Props) {
  const viewerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    viewerRef.current.innerHTML = "";

    pannellum.viewer(viewerRef.current, {
      type: "equirectangular",
      panorama: imageUrl,
      autoLoad: true,
      controlBar: true,
      showControls: true,
    });
  }, [imageUrl]);

  return (
    <div
      ref={viewerRef}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid #ddd",
      }}
    ></div>
  );
}
