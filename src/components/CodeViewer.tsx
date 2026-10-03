import React, { useState } from 'react';
import { SysMonConfig, SysMonTheme } from '../types';
import { getAllProjectFiles } from '../data/pythonCodeGenerator';
import { Copy, Check, FileCode, Download, Terminal, BookOpen, Layers } from 'lucide-react';

interface CodeViewerProps {
  config: SysMonConfig;
  theme: SysMonTheme;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ config, theme }) => {
  const files = getAllProjectFiles(config, theme);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = files[selectedFileIdx] || files[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* File Tabs Navigation Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {files.map((file, idx) => (
            <button
              key={file.filename}
              onClick={() => setSelectedFileIdx(idx)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedFileIdx === idx
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>{file.filename}</span>
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadSingleFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-all border border-cyan-500/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </button>
        </div>
      </div>

      {/* File Description Header */}
      <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/80 text-xs text-slate-400 flex items-center justify-between font-mono">
        <span>{activeFile.description}</span>
        <span className="text-slate-500 uppercase">{activeFile.language}</span>
      </div>

      {/* Code Text Container with Line Numbers */}
      <div className="p-6 overflow-x-auto font-fantasque text-xs text-slate-200 leading-relaxed bg-slate-950 max-h-[600px] overflow-y-auto">
        <pre className="whitespace-pre select-text">
          {activeFile.content.split('\n').map((line, idx) => (
            <div key={idx} className="table-row">
              <span className="table-cell pr-6 text-right select-none text-slate-600 font-mono text-[11px]">
                {idx + 1}
              </span>
              <span className="table-cell">{line}</span>
            </div>
          ))}
        </pre>
      </div>

    </div>
  );
};
