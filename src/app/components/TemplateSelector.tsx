'use client';

import React from 'react';
import { LayoutTemplate, Check } from 'lucide-react';
import { TemplateType } from '../types';

interface TemplateOption {
  value: TemplateType;
  label: string;
  description: string;
}

const templates: TemplateOption[] = [
  { value: 'modern', label: 'Modern', description: 'Clean minimalist with accent colors' },
  { value: 'classic', label: 'Classic', description: 'Traditional borders and structured layout' },
  { value: 'professional', label: 'Professional', description: 'Bold header with sidebar, corporate feel' },
];

interface TemplateSelectorProps {
  selected: TemplateType;
  onChange: (template: TemplateType) => void;
}

export default function TemplateSelector({ selected, onChange }: TemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        <LayoutTemplate size={16} className="inline mr-1" />
        Design Template
      </label>
      <div className="grid grid-cols-3 gap-2">
        {templates.map((template) => (
          <button
            key={template.value}
            type="button"
            onClick={() => onChange(template.value)}
            className={`relative p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
              selected === template.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {selected === template.value && (
              <span className="absolute top-1 right-1 text-blue-500">
                <Check size={14} />
              </span>
            )}
            <span className="block text-sm font-semibold text-gray-800">{template.label}</span>
            <span className="block text-xs text-gray-500 mt-1">{template.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
