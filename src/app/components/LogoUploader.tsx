'use client';

import React, { useRef } from 'react';
import { MAX_LOGO_BYTES } from '../types';
import { ImageIcon, XIcon } from './icons';

interface LogoUploaderProps {
  logo: string | null;
  onChange: (logo: string | null) => void;
}

export default function LogoUploader({ logo, onChange }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      alert('Please upload a PNG, JPEG, WebP, or GIF image.');
      return;
    }

    // The draft is persisted to localStorage, so an oversized image would fail
    // the save after the user had already typed the whole document.
    if (file.size > MAX_LOGO_BYTES) {
      alert(`That image is too large. Logos must be under ${MAX_LOGO_BYTES / (1024 * 1024)} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => alert('That image could not be read. Please try another file.');
    reader.onloadend = () => {
      if (typeof reader.result === 'string') onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Company Logo</label>
      {logo ? (
        <div className="relative inline-block">
          <img
            src={logo}
            alt="Company logo preview"
            className="h-24 w-auto object-contain border rounded-lg"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors cursor-pointer"
            title="Remove logo"
            aria-label="Remove logo"
          >
            <XIcon size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <ImageIcon size={24} className="mb-1 text-gray-400" />
          <span className="text-sm text-gray-500">Click to upload logo</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
