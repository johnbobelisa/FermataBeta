import { useState, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import ImageUploader from './components/ImageUploader';
import CanvasArea from './components/CanvasArea';
import SidePanel from './components/SidePanel';
import { useHoldsManager } from './hooks/useHoldsManager';
import { generateBetaPdf } from './utils/pdfGenerator';
import type { BetaSequence } from './types';

function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [betaSequence, setBetaSequence] = useState<BetaSequence | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    
    // Calculate click coordinates relative to the canvas's displayed size
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalize coordinates based on the element's size, not the canvas buffer size
    const xNorm = x / rect.width;
    const yNorm = y / rect.height;

    // Find clicked hold based on normalized coordinates
    const clicked = holds.find(h => {
        const hX = h.xNorm * rect.width;
        const hY = h.yNorm * rect.height;
        return Math.hypot(hX - x, hY - y) <= 15;
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
    if (!image || !canGenerateBeta()) return alert('Please set up the problem correctly.');

    setLoading(true);
    const problemData = {
      // Sending raw image data can be huge. A reference or pre-upload might be better.
      // For now, let's assume we send a smaller version if needed, or just the metadata.
      wallImage: 'Image data placeholder', // Avoid sending large data URIs in every request
      holds: holds.map(h => ({ id: h.id, coords: [h.xNorm, h.yNorm], type: h.type })),
      startState,
      finishHold
    };

    try {
      // Mocking the backend call
      console.log("Sending to backend:", problemData);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network latency
      
      // MOCK RESPONSE
      const mockBetaResult: BetaSequence = [
          startState,
          { ...startState, RH: finishHold }, // Simple mock: move right hand to finish
      ];

      setBetaSequence(mockBetaResult);
      alert('Beta generated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to generate beta.');
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