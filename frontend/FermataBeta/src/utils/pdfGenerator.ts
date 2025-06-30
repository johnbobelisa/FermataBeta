import jsPDF from 'jspdf';
import type { ClimberState, Hold } from '../types';
import { drawClimber } from './skeleton'; // We'll need this

// This function is illustrative. The actual drawing functions for holds
// would need to be passed or imported.
const redrawCanvasForPdf = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    holds: Hold[],
    climberState: ClimberState
) => {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    holds.forEach((hold) => {
        // Simplified hold drawing for PDF
        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.arc(hold.xNorm * canvas.width, hold.yNorm * canvas.height, 12, 0, 2 * Math.PI);
        ctx.fill();
    });

    drawClimber(ctx, climberState, holds, canvas.width, canvas.height);
};


export const generateBetaPdf = (
  baseImage: HTMLImageElement,
  holds: Hold[],
  betaSequence: ClimberState[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [baseImage.width, baseImage.height]
  });

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = baseImage.width;
  offscreenCanvas.height = baseImage.height;
  const ctx = offscreenCanvas.getContext('2d');

  if (!ctx) {
    alert('Failed to create off-screen canvas for PDF generation.');
    return;
  }

  betaSequence.forEach((step, index) => {
    redrawCanvasForPdf(ctx, baseImage, holds, step);
    const dataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.8);

    if (index > 0) {
      doc.addPage();
    }
    doc.addImage(dataUrl, 'JPEG', 0, 0, baseImage.width, baseImage.height);
    doc.setFontSize(16);
    doc.setTextColor('#FFFFFF');
    doc.text(`Step ${index + 1}`, 20, 30);
  });

  doc.save('climbing-beta.pdf');
};