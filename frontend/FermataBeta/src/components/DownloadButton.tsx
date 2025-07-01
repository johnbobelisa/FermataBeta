import React from 'react';
import type { Hold, BetaSequence } from '../types/types';
import { generateBetaPdf } from '../utils/pdfGenerator';

interface DownloadButtonProps {
  backgroundImage: HTMLImageElement | null;
  holds: Hold[];
  betaSequence: BetaSequence | null;
  disabled: boolean;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  backgroundImage,
  holds,
  betaSequence,
  disabled,
}) => {
  const handleDownload = () => {
    if (!backgroundImage || !betaSequence || betaSequence.length === 0) {
      alert('Cannot generate PDF. Ensure an image is loaded and a beta has been generated.');
      return;
    }
    console.log('Starting PDF generation...');
    generateBetaPdf(backgroundImage, holds, betaSequence);
    console.log('PDF generation complete.');
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || !betaSequence}
      className={`px-4 py-2 font-semibold text-white rounded-lg shadow-md ${
        disabled || !betaSequence
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-500 hover:bg-blue-700'
      }`}
    >
      Download Beta as PDF
    </button>
  );
};

export default DownloadButton;