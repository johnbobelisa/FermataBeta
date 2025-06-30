import React, { useEffect } from 'react';
import type { Hold, ClimberState, BetaSequence } from '../types';
import { drawClimber } from '../utils/skeleton';

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  image: HTMLImageElement | null;
  holds: Hold[];
  loading: boolean;
  onCanvasClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onGenerate: () => void;
  canGenerate: boolean;
  selectedHold: number | null;
  startState: ClimberState;
  betaSequence: BetaSequence | null;
  onDownloadPdf: () => void;
}

export default function CanvasArea({
  canvasRef,
  image,
  holds,
  loading,
  onCanvasClick,
  onGenerate,
  canGenerate,
  selectedHold,
  startState,
  betaSequence,
  onDownloadPdf
}: Props) {

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution to match image, but scale display with CSS
    canvas.width = image.width;
    canvas.height = image.height;
    
    // Redraw everything
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    // Draw holds
    holds.forEach((hold) => {
      const isSelected = selectedHold === hold.id;
      const holdX = hold.xNorm * canvas.width;
      const holdY = hold.yNorm * canvas.height;

      const colorMap = {
          'start_hand': '#22C55E', 'start_foot': '#3B82F6',
          'finish_hold': '#EF4444', 'climbing_hold': '#F97316'
      };
      
      ctx.fillStyle = isSelected ? '#FFD700' : colorMap[hold.type];
      ctx.beginPath();
      ctx.arc(holdX, holdY, isSelected ? 15 : 12, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#000' : '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw skeleton for the initial state
    drawClimber(ctx, startState, holds, canvas.width, canvas.height);

  }, [image, holds, selectedHold, startState, canvasRef]);


  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {image ? (
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Route Image</h2>
          </div>
          <div className="flex justify-center mb-4">
            <canvas
              ref={canvasRef}
              onClick={onCanvasClick}
              className="max-w-full h-auto border border-gray-200 rounded-lg shadow-sm cursor-crosshair"
            />
          </div>
          <div className="text-center flex justify-center gap-4">
            <button
              onClick={onGenerate}
              disabled={loading || !canGenerate}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                loading || !canGenerate
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Generating...' : 'Generate Beta'}
            </button>
            {betaSequence && (
                <button 
                    onClick={onDownloadPdf}
                    className="px-6 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                    Download PDF
                </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-gray-400">No image uploaded yet</div>
      )}
    </div>
  );
}