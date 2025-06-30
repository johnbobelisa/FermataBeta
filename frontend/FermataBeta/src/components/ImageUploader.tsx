import React from 'react';

interface Props {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ImageUploader({ onUpload }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            {/* SVG */}
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
                onChange={onUpload}
                className="sr-only"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
