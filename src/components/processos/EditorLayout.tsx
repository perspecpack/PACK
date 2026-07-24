import React from 'react';

interface EditorLayoutProps {
  header: React.ReactNode;
  canvas: React.ReactNode;
  sidebar: React.ReactNode;
}

export default function EditorLayout({ header, canvas, sidebar }: EditorLayoutProps) {
  return (
    <div className="flex flex-row min-h-[calc(100vh-140px)] w-full overflow-hidden relative">
      {/* Main Workspace Area (Header + Canvas) */}
      <div className="flex-1 flex flex-col min-w-0 pr-0 transition-all duration-300">
        {header}
        <div className="flex-1 overflow-y-auto px-1">
          {canvas}
        </div>
      </div>

      {/* Sidebar Panel Portal / Overlay Wrapper */}
      <div className="shrink-0">
        {sidebar}
      </div>
    </div>
  );
}
