'use client';

import { useRef, useState } from 'react';

interface FormFileInputProps {
  label: string;
  name: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  required?: boolean;
  accept?: string;
}

const MAX_SIZE_MB = 10;

export function FormFileInput({
  label,
  name,
  file,
  onChange,
  error,
  required = true,
  accept = 'application/pdf,image/png,image/jpeg',
}: FormFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(fileList: FileList | null) {
    const picked = fileList?.[0] ?? null;
    if (picked && picked.size > MAX_SIZE_MB * 1024 * 1024) {
      onChange(null);
      return;
    }
    onChange(picked);
  }

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition
          ${
            error
              ? 'border-red-300 bg-red-50/50'
              : dragOver
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/40'
          }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-slate-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0-3 3m3-3 3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
        </svg>
        {file ? (
          <p className="text-sm font-medium text-slate-700">{file.name}</p>
        ) : (
          <>
            <p className="text-sm text-slate-500">
              Arrastra el archivo o <span className="font-semibold text-emerald-600">selecciónalo</span>
            </p>
            <p className="text-xs text-slate-400">PDF, JPG o PNG — máx. {MAX_SIZE_MB}MB</p>
          </>
        )}
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
