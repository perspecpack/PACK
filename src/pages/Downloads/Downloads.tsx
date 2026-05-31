import React, { useState, useEffect } from 'react';
import { Box, FileText, CheckSquare, FolderKanban, ShieldCheck, Download, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useApp } from '@/src/context/AppContext';

// Icons map to render category icons dynamically based on their string names
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Box: Box,
  FileText: FileText,
  ShieldCheck: ShieldCheck,
  CheckSquare: CheckSquare,
  FolderKanban: FolderKanban,
  Layers: Layers
};

export default function Downloads() {
  const { oems, categories, files } = useApp();
  const [selectedOEM, setSelectedOEM] = useState<string>('');

  // Active OEMs only
  const activeOems = oems.filter(o => o.status === 'active');
  const activeCategories = categories.filter(c => c.status === 'active');

  // Set default selected OEM on load
  useEffect(() => {
    if (activeOems.length > 0 && !selectedOEM) {
      setSelectedOEM(activeOems[0].id);
    }
  }, [activeOems, selectedOEM]);

  const selectedOEMName = activeOems.find(o => o.id === selectedOEM)?.name;

  // Filter files of the selected OEM that are published
  const filteredFiles = files.filter(f => f.oemId === selectedOEM && f.status === 'published');

  // Helper to render static vector logos or abbreviations
  const renderOEMLogo = (name: string, logoUrl?: string) => {
    if (logoUrl) {
      return <img src={logoUrl} alt={name} className="h-10 object-contain max-w-[120px]" />;
    }

    const n = name.toLowerCase();
    if (n.includes('volkswagen') || n === 'vw') {
      return <div className="text-2xl font-bold font-serif text-blue-900 border-2 border-blue-900 rounded-full w-12 h-12 flex items-center justify-center">W</div>;
    }
    if (n.includes('hyundai')) {
      return <div className="text-2xl font-bold font-serif italic text-blue-800">H</div>;
    }
    if (n.includes('nissan')) {
      return <div className="text-[13px] font-bold border border-gray-800 rounded-full px-2 py-0.5 tracking-wider">NISSAN</div>;
    }
    if (n.includes('renault')) {
      return <div className="w-6 h-9 border-4 border-yellow-500 transform rotate-45 shrink-0 mx-auto"></div>;
    }
    if (n.includes('scania')) {
      return <div className="text-sm font-black text-red-600 tracking-wide">SCANIA</div>;
    }
    if (n.includes('gestamp')) {
      return <div className="text-sm font-bold text-blue-700 tracking-tighter">Gestamp</div>;
    }

    // Default abbreviation
    return <div className="text-lg font-bold text-slate-700 uppercase bg-slate-100 rounded px-3 py-1.5">{name.substring(0, 2)}</div>;
  };

  // Helper to get category file count
  const getCategoryFileCount = (catId: string) => {
    return files.filter(f => f.oemId === selectedOEM && f.categoryId === catId && f.status === 'published').length;
  };

  // Helper to resolve icon component
  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || Box;
  };

  // Helper to get category name by ID
  const getCategoryName = (catId: string) => {
    return categories.find(c => c.id === catId)?.name || 'Outros';
  };

  return (
    <div className="flex flex-col gap-10 max-w-[1200px] mx-auto pb-12">
      {/* Selecione a Organização */}
      <section>
        <h2 className="text-[15px] font-bold text-gray-800 mb-4 uppercase tracking-wider">Selecione a organização</h2>
        
        {activeOems.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 font-medium">
            Nenhuma organização ativa cadastrada pelo administrador.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {activeOems.map((oem) => (
              <button
                key={oem.id}
                onClick={() => setSelectedOEM(oem.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-6 bg-white border rounded-xl transition-all duration-200 gap-4 cursor-pointer",
                  selectedOEM === oem.id 
                    ? "border-teal-500 shadow-md shadow-teal-500/10 ring-1 ring-teal-500 scale-[1.02]" 
                    : "border-gray-200 hover:border-teal-300 hover:shadow-sm"
                )}
              >
                <div className="h-14 flex items-center justify-center grayscale opacity-80 mix-blend-multiply transition-all">
                  {renderOEMLogo(oem.name, oem.logoUrl)}
                </div>
                <span className="text-[13px] font-bold text-gray-900">{oem.name}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedOEM && (
        <>
          {/* Conteúdo Disponível */}
          <section>
            <h2 className="text-[15px] font-bold text-gray-800 mb-4 uppercase tracking-wider">
              Conteúdo disponível &mdash; {selectedOEMName}
            </h2>
            
            {activeCategories.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 font-medium">
                Nenhuma categoria ativa configurada.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {activeCategories.map((cat) => {
                  const IconComponent = getIcon(cat.icon);
                  const fileCount = getCategoryFileCount(cat.id);
                  return (
                    <div 
                      key={cat.id} 
                      className="bg-white border border-gray-200 p-6 rounded-xl flex flex-col items-center text-center hover:border-teal-400 hover:shadow-md hover:shadow-teal-500/5 transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-teal-50/80 text-teal-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-teal-100/80 transition-colors">
                        <IconComponent className="w-7 h-7" />
                      </div>
                      <h3 className="text-[13px] font-bold text-gray-900 mb-1 leading-snug h-10 flex items-center">{cat.name}</h3>
                      <span className="inline-flex items-center justify-center bg-teal-50 text-teal-700 text-[12px] font-bold px-2 py-0.5 rounded-md mt-2">
                        {fileCount} arquivos
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Arquivos Recentes */}
          <section>
            <h2 className="text-[15px] font-bold text-gray-800 mb-4 uppercase tracking-wider">Arquivos recentes</h2>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50 border-b border-gray-200">
                  <TableRow className="hover:bg-gray-50">
                    <TableHead className="text-[12px] font-semibold text-gray-600 uppercase h-12">Nome</TableHead>
                    <TableHead className="text-[12px] font-semibold text-gray-600 uppercase h-12">Categoria</TableHead>
                    <TableHead className="text-[12px] font-semibold text-gray-600 uppercase h-12">Organização</TableHead>
                    <TableHead className="text-[12px] font-semibold text-gray-600 uppercase h-12 w-[100px]">Tipo</TableHead>
                    <TableHead className="text-[12px] font-semibold text-gray-600 uppercase h-12 w-[100px]">Rev.</TableHead>
                    <TableHead className="text-right text-[12px] font-semibold text-gray-600 uppercase h-12 pr-6 w-[100px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-28 text-center text-gray-400 font-medium">
                        Nenhum arquivo publicado disponível para esta organização.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFiles.map((file) => (
                      <TableRow key={file.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-bold text-[13px] text-gray-900 max-w-[280px] truncate">{file.name}</TableCell>
                        <TableCell className="text-[13px] text-gray-600">{getCategoryName(file.categoryId)}</TableCell>
                        <TableCell className="text-[13px] text-gray-600">{selectedOEMName}</TableCell>
                        <TableCell>
                          <span className="bg-gray-100 border border-gray-200 text-gray-700 px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
                            {file.fileType}
                          </span>
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-700 font-semibold font-mono">{file.revision}</TableCell>
                        <TableCell className="text-right pr-6">
                          <a href={file.fileUrl} target="_blank" rel="noreferrer">
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8 w-8 p-0 rounded-md shadow-sm">
                              <Download className="w-[15px] h-[15px]" />
                            </Button>
                          </a>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

