'use client';

import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';

interface Props {
  onSend: (text: string, file?: File) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: Props) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = !isLoading && (text.trim().length > 0 || file !== null);

  const handleSend = () => {
    if (!canSend) return;
    onSend(text, file ?? undefined);
    setText('');
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="px-4 pt-3 pb-4">
      {/* File preview */}
      {file && (
        <div className="mb-3 flex items-center gap-2">
          {preview ? (
            <div className="relative inline-block">
              <img
                src={preview}
                alt="preview"
                className="h-16 w-16 rounded-lg object-cover border border-gray-700"
              />
              <button
                onClick={removeFile}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center text-white text-xs transition-colors"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 text-gray-300 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="max-w-[200px] truncate">{file.name}</span>
              <button onClick={removeFile} className="text-gray-500 hover:text-gray-300 ml-1">×</button>
            </div>
          )}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2 bg-gray-800 rounded-2xl px-4 py-3">
        {/* Attach file button */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.txt,.csv,.json,.md"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          title="Attach file or image"
          className="text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0 disabled:opacity-40"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message chatbot…"
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 resize-none outline-none text-sm leading-6 max-h-40 overflow-y-auto disabled:opacity-60"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          title="Send message"
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-center text-gray-600 text-xs mt-2">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
