// src/utils/pdfGenerator.ts

import jsPDF from 'jspdf';
import type { Hold, ClimberState, BetaSequence } from '../types/types';
import { drawClimber } from './skeleton';

/**
 * Generates and triggers the download of a PDF slideshow for the climbing beta.
 */
export function generateBetaPdf(
  image: HTMLImageElement,
  holds: Hold[],
  betaSequence: BetaSequence
) {
  // 1. Initialize jsPDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [image.width, image.height],
    compress: true,
  });

  // 2. Create an off-screen canvas for drawing each frame
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    alert('Error: Cannot create canvas context for PDF generation.');
    return;
  }

  // 3. Iterate through each state in the beta sequence
  betaSequence.forEach((state, index) => {
    // a. Clear and draw the background wall image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // b. Draw all the holds
    holds.forEach(hold => {
      const x = hold.xNorm * canvas.width;
      const y = hold.yNorm * canvas.height;
      
      // Color-code holds based on type
      if (hold.type === 'start_hand') ctx.fillStyle = '#22C55E';      // Green
      else if (hold.type === 'start_foot') ctx.fillStyle = '#3B82F6'; // Blue
      else if (hold.type === 'finish_hold') ctx.fillStyle = '#EF4444';// Red
      else ctx.fillStyle = '#F97316';                                 // Orange
      
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, 2 * Math.PI); // Draw hold as a circle
      ctx.fill();
    });

    // c. Draw the climber's skeleton for the current state
    drawClimber(ctx, state, holds, canvas.width, canvas.height);

    // d. Add a step number overlay
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.font = 'bold 24px Arial';
    const text = `Step ${index}`;
    ctx.strokeText(text, 15, 30);
    ctx.fillText(text, 15, 30);

    // e. Add the canvas image to the PDF
    const dataURL = canvas.toDataURL('image/jpeg', 0.9); // Use JPEG for smaller size
    if (index > 0) {
      pdf.addPage();
    }
    pdf.addImage(dataURL, 'JPEG', 0, 0, image.width, image.height);
  });

  // 4. Save and trigger the PDF download
  pdf.save('climbing-beta.pdf');
}