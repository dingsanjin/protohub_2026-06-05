import { useEffect, useRef, useState } from 'react';

interface DrawioViewerProps {
  xml: string;
}

declare global {
  interface Window {
    mxLoadResources?: () => void;
    drawio?: {
      loadEmbedded: (win: Window) => void;
    };
  }
}

export default function DrawioViewer({ xml }: DrawioViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadScript = async () => {
      if (loaded) return;

      const script = document.createElement('script');
      script.src = 'https://app.diagrams.net/js/embed.min.js';
      script.onload = () => {
        setLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load diagrams.net embed script');
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    loadScript();
  }, [loaded]);

  useEffect(() => {
    if (loaded && containerRef.current && typeof window !== 'undefined') {
      const mxgraphConfig = {
        zoom: 1,
        toolbar: 'zoom',
        edit: '_blank',
        xml: xml,
      };
      containerRef.current.setAttribute('data-mxgraph', JSON.stringify(mxgraphConfig));
      
      if (window.mxLoadResources) {
        window.mxLoadResources();
      } else if (window.drawio) {
        window.drawio.loadEmbedded(window);
      }
    }
  }, [loaded, xml]);

  return (
    <div style={{ padding: '20px', minHeight: 'calc(100vh - 120px)' }}>
      <div
        ref={containerRef}
        className="mxgraph"
        style={{ maxWidth: '100%', border: '1px solid #e8e8e8', borderRadius: '8px' }}
      />
      {!loaded && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          正在加载 Draw.io 查看器...
        </div>
      )}
    </div>
  );
}