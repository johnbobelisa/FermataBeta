// React Component: App
// React components return JSX, which React will turn into HTML and inject into #root

// THIS IS THE HOME PAGE OF FermataBeta
import { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';

type HoldType = 'start_hand' | 'start_foot' | 'finish_hold' | 'climbing_hold';
type Hold = { 
  id: number;
  x: number; 
  y: number; 
  type: HoldType;
};
type ClimberState = {
  RH: number | null; // Right Hand
  LH: number | null; // Left Hand  
  RF: number | null; // Right Foot
  LF: number | null; // Left Foot
};

function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [holds, setHolds] = useState<Hold[]>([]);
  const [selectedHold, setSelectedHold] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextHoldId, setNextHoldId] = useState(0);
  const [startState, setStartState] = useState<ClimberState>({
    RH: null, LH: null, RF: null, LF: null
  });
  const [finishHold, setFinishHold] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setOriginalDataUrl(dataUrl);

    console.log('Canvas setup complete via useEffect');
  }, [image]);

  // Redraw holds whenever holds array changes
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    redrawCanvas();
  }, [holds, selectedHold, image]);

  const getHoldColor = (type: HoldType, isSelected: boolean) => {
    if (isSelected) return '#FFD700'; // Gold for selected
    
    switch (type) {
      case 'start_hand': return '#22C55E'; // Green
      case 'start_foot': return '#3B82F6'; // Blue  
      case 'finish_hold': return '#EF4444'; // Red
      case 'climbing_hold': return '#F97316'; // Orange
      default: return '#6B7280'; // Gray
    }
  };

  const getHoldLabel = (type: HoldType, holdId: number): string => {
    const limbs = Object.entries(startState)
      .filter(([_, id]) => id === holdId)
      .map(([limb]) => limb)
      .sort(); // Consistent order

    if (limbs.length > 0) {
      return limbs.join('/');
    }

    switch (type) {
      case 'start_hand': return 'SH';
      case 'start_foot': return 'SF';
      case 'finish_hold': return 'F';
      case 'climbing_hold': return 'H';
      default: return '?';
    }
  };


  const redrawCanvas = () => {
    if (!image || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    // Draw all holds
    holds.forEach((hold) => {
      const isSelected = selectedHold === hold.id;
      const color = getHoldColor(hold.type, isSelected);
      const label = getHoldLabel(hold.type, hold.id);

      // Draw circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(hold.x, hold.y, isSelected ? 15 : 12, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = isSelected ? '#000000' : '#FFFFFF';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, hold.x, hold.y + 4);

      // Draw ID number below
      ctx.fillStyle = '#000000';
      ctx.font = '10px sans-serif';
      ctx.fillText(hold.id.toString(), hold.x, hold.y + 25);
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset everything
    setHolds([]);
    setImage(null);
    setOriginalDataUrl(null);
    setSelectedHold(null);
    setNextHoldId(0);
    setStartState({ RH: null, LH: null, RF: null, LF: null });
    setFinishHold(null);

    const img = new Image();

    img.onerror = (error) => {
      console.error('Failed to load image:', error);
      alert('Failed to load the selected image. Please try a different image.');
    };

    img.onload = () => {
      // Resize image on a temporary canvas to 800x600
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 800;
      tempCanvas.height = 600;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

      const resizedImg = new Image();
      resizedImg.onload = () => {
        setImage(resizedImg);
        const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
        setOriginalDataUrl(dataUrl);
      };
      resizedImg.src = tempCanvas.toDataURL('image/jpeg', 0.9);
    };


    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    event.target.value = '';
    console.log('Started loading image from:', objectUrl);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = Math.round(x * scaleX);
    const canvasY = Math.round(y * scaleY);

    // Check if clicking on existing hold
    const clickedHold = holds.find(hold => {
      const distance = Math.sqrt((hold.x - canvasX) ** 2 + (hold.y - canvasY) ** 2);
      return distance <= 15; // Click tolerance
    });

    if (clickedHold) {
      setSelectedHold(selectedHold === clickedHold.id ? null : clickedHold.id);
    } else {
      // Create new hold
      const newHold: Hold = {
        id: nextHoldId,
        x: canvasX,
        y: canvasY,
        type: 'climbing_hold'
      };
      setHolds(prev => [...prev, newHold]);
      setSelectedHold(newHold.id);
      setNextHoldId(prev => prev + 1);
    }
  };

  const assignHoldType = (type: HoldType) => {
    if (selectedHold === null) return;

    setHolds(prev => prev.map(hold => 
      hold.id === selectedHold ? { ...hold, type } : hold
    ));

    // Update start state or finish hold
    if (type === 'finish_hold') {
      setFinishHold(selectedHold);
    }

    setSelectedHold(null);
  };

  const assignLimbToHold = (limb: keyof ClimberState) => {
    if (selectedHold === null) return;

    setStartState(prev => ({
      ...prev,
      [limb]: selectedHold
    }));
    setSelectedHold(null);
  };

  const clearHolds = () => {
    setHolds([]);
    setSelectedHold(null);
    setNextHoldId(0);
    setStartState({ RH: null, LH: null, RF: null, LF: null });
    setFinishHold(null);
    redrawCanvas();
  };

  const removeSelectedHold = () => {
    if (selectedHold === null) return;

    setHolds(prev => prev.filter(hold => hold.id !== selectedHold));
    
    // Clean up references to removed hold
    setStartState(prev => ({
      RH: prev.RH === selectedHold ? null : prev.RH,
      LH: prev.LH === selectedHold ? null : prev.LH,
      RF: prev.RF === selectedHold ? null : prev.RF,
      LF: prev.LF === selectedHold ? null : prev.LF,
    }));
    
    if (finishHold === selectedHold) {
      setFinishHold(null);
    }
    
    setSelectedHold(null);
  };

  const handleGenerateBeta = async () => {
    if (!originalDataUrl || holds.length === 0) {
      alert('Please upload an image and tag some holds first.');
      return;
    }

    // Validate we have required holds
    const hasValidStart = Object.values(startState).some(limb => limb !== null);
    if (!hasValidStart) {
      alert('Please assign at least one limb to a starting position.');
      return;
    }

    if (finishHold === null) {
      alert('Please assign a finish hold.');
      return;
    }

    setLoading(true);
    
    const problemData = {
      wallImage: originalDataUrl,
      holds: holds.map(hold => ({
        id: hold.id,
        coords: [hold.x, hold.y],
        type: hold.type
      })),
      startState,
      finishHold
    };

    console.log('Problem Definition:', JSON.stringify(problemData, null, 2));

    try {
      const BACKEND_URL = 'http://localhost:5000';

      const response = await fetch(`${BACKEND_URL}/generate-beta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(problemData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Beta generated:', result);
      alert('Beta generated successfully! Check console for details.');
    } catch (err) {
      console.error('Error generating beta:', err);
      alert('Failed to generate beta. Backend not connected - problem data logged to console.');
    } finally {
      setLoading(false);
    }
  };

  const canGenerateBeta = () => {
    const hasValidStart = Object.values(startState).some(limb => limb !== null);
    return holds.length > 0 && hasValidStart && finishHold !== null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-20 px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Boulder Beta</h1>
            <p className="text-lg text-gray-600">Upload and get beta in mere seconds!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Upload area */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75" />
                      </svg>
                    </div>
                    <div>
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <span className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          Choose an image file
                        </span>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image canvas area */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {image ? (
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Your Route Image</h2>
                      <div className="flex gap-2 items-center">
                        <span className="text-sm text-gray-600">
                          Holds: {holds.length}
                        </span>
                        {holds.length > 0 && (
                          <button
                            onClick={clearHolds}
                            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center mb-4">
                      <canvas
                        ref={canvasRef}
                        onClick={handleCanvasClick}
                        className="max-w-full h-auto border border-gray-200 rounded-lg shadow-sm cursor-crosshair"
                      />
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-4">
                        Click to add holds, then click holds to select them. Use the side panel to assign types and limbs.
                      </p>
                      <button
                        onClick={handleGenerateBeta}
                        disabled={loading || !canGenerateBeta()}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                          loading || !canGenerateBeta()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {loading ? 'Generating Beta...' : 'Generate Beta'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">No image uploaded yet</p>
                    <p className="text-gray-400 text-sm mt-1">Select an image above to get started</p>
                  </div>
                )}
              </div>
            </div>

            {/* Side panel for hold management */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hold Management</h3>
                
                {selectedHold !== null ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        Hold #{selectedHold} selected
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Assign Hold Type:</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => assignHoldType('start_hand')}
                          className="w-full px-3 py-2 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                        >
                          Start Hand
                        </button>
                        <button
                          onClick={() => assignHoldType('start_foot')}
                          className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                        >
                          Start Foot
                        </button>
                        <button
                          onClick={() => assignHoldType('finish_hold')}
                          className="w-full px-3 py-2 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                        >
                          Finish Hold
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Assign Starting Limb:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => assignLimbToHold('RH')}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
                        >
                          Right Hand
                        </button>
                        <button
                          onClick={() => assignLimbToHold('LH')}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
                        >
                          Left Hand
                        </button>
                        <button
                          onClick={() => assignLimbToHold('RF')}
                          className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors"
                        >
                          Right Foot
                        </button>
                        <button
                          onClick={() => assignLimbToHold('LF')}
                          className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors"
                        >
                          Left Foot
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={removeSelectedHold}
                      className="w-full px-3 py-2 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                    >
                      Remove Hold
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <p className="text-sm mb-4">
                      Click a hold on the image to select it and assign properties.
                    </p>
                    <p className="text-xs text-gray-400">
                      Click empty space to add new holds.
                    </p>
                  </div>
                )}

                {/* Problem status */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Problem Status</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Starting Positions:</span>
                      <span className="font-medium">
                        {Object.entries(startState).filter(([_, hold]) => hold !== null).length}/4
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Finish Hold:</span>
                      <span className="font-medium">
                        {finishHold !== null ? `#${finishHold}` : 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Holds:</span>
                      <span className="font-medium">{holds.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;