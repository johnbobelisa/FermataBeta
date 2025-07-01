import { useState, useRef, useCallback, useEffect } from 'react';
import Navbar from './components/Navbar';
import ImageUploader from './components/ImageUploader';
import CanvasArea from './components/CanvasArea';
import SidePanel from './components/SidePanel';
import { useHoldsManager } from './hooks/useHoldsManager';
import { generateBetaPdf } from './utils/pdfGenerator';
import type { BetaSequence } from './types/types';

function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [betaSequence, setBetaSequence] = useState<BetaSequence | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const HOLD_RADIUS_PX = 15;

  useEffect(() => {
    return () => {
      if (image && image.src.startsWith('blob:')) {
        URL.revokeObjectURL(image.src);
      }
    };
  }, [image]);

  const {
    holds,
    selectedHold,
    startState,
    finishHold,
    addHold,
    selectHold,
    assignHoldType,
    assignLimbToHold,
    removeSelectedHold,
    resetState
  } = useHoldsManager();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetState();
    setImage(null);
    setBetaSequence(null);

    const img = new Image();
    img.onload = () => {
      // For simplicity, we directly use the loaded image.
      // Resizing can be handled here if needed, but drawing will adapt.
      setImage(img);
    };
    img.src = URL.createObjectURL(file);
    event.target.value = '';
  };

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xNorm = x / rect.width;
    const yNorm = y / rect.height;

    const clicked = holds.find(h => {
      const hX = h.xNorm * rect.width;
      const hY = h.yNorm * rect.height;
      // Use the same constant radius for click detection
      return Math.hypot(hX - x, hY - y) <= HOLD_RADIUS_PX;
    });

    if (clicked) {
      selectHold(clicked.id);
    } else {
      addHold(xNorm, yNorm);
    }
  }, [holds, addHold, selectHold]);

  const canGenerateBeta = () => {
    const hasStart = Object.values(startState).some(limb => limb !== null);
    return holds.length > 0 && hasStart && finishHold !== null;
  };

  const handleGenerateBeta = async () => {
    if (!image || !canGenerateBeta()) {
      alert('Please define the start and finish holds to generate a beta.');
      return;
    }

    setLoading(true);

    // The route data structure should match what your Python backend expects.
    const problemData = {
      holds: holds.map(h => ({
        id: h.id,
        type: h.type,
        xNorm: h.xNorm,
        yNorm: h.yNorm
      })),
      start: startState,
      finish: finishHold
    };

    try {
      // Replace 'http://localhost:5000/generate-beta' with your actual backend endpoint.
      const response = await fetch('http://localhost:5000/generate-beta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(problemData),
      });

      if (!response.ok) {
        // Handle HTTP errors like 404 or 500
        const errorData = await response.json();
        throw new Error(errorData.message || 'The server responded with an error.');
      }

      const result: BetaSequence = await response.json(); // The path from the A* search
      setBetaSequence(result);
      // You could remove the alert for a smoother UX
      // alert('Beta generated successfully!');

    } catch (err) {
      console.error("Failed to generate beta:", err);
      alert(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadPdf = () => {
      if (!image || !betaSequence) return;
      generateBetaPdf(image, holds, betaSequence);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 px-6 pb-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <ImageUploader onUpload={handleImageUpload} />
            <CanvasArea
              canvasRef={canvasRef}
              image={image}
              holds={holds}
              loading={loading}
              onCanvasClick={handleCanvasClick}
              onGenerate={handleGenerateBeta}
              canGenerate={canGenerateBeta()}
              selectedHold={selectedHold}
              startState={startState}
              betaSequence={betaSequence}
              onDownloadPdf={handleDownloadPdf}
            />
          </div>
          <SidePanel
            selectedHold={selectedHold}
            assignHoldType={assignHoldType}
            assignLimbToHold={assignLimbToHold}
            removeSelectedHold={removeSelectedHold}
            startState={startState}
            finishHold={finishHold}
            holdsLength={holds.length}
          />
        </div>
      </div>
    </div>
  );
}

export default App;