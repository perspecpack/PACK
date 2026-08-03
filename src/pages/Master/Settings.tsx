import React from 'react';
import { useApp } from '@/src/context/AppContext';
import { Shield, HardDrive, Database, FileText, Layers, ShieldCheck, Cpu } from 'lucide-react';

const cleanEnvVar = (val?: string) => val ? val.replace(/^["']|["']$/g, '').trim() : '';

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function Settings() {
  const { user, components, documents, standards } = useApp();

  const [activeTab, setActiveTab] = React.useState<'overview' | 'details'>('overview');

  // Aggregated Storage Statistics
  const storageStats = React.useMemo(() => {
    let totalSize = 0;
    let totalCount = 0;
    let stepSize = 0;
    let stepCount = 0;
    let pdfSize = 0;
    let pdfCount = 0;
    let dwgSize = 0;
    let dwgCount = 0;
    let imageSize = 0;
    let imageCount = 0;
    let otherSize = 0;
    let otherCount = 0;

    let compStats = { size: 0, count: 0 };
    let docStats = { size: 0, count: 0 };
    let stdStats = { size: 0, count: 0 };

    const processFile = (size: number, ext: string) => {
      totalSize += size;
      totalCount += 1;
      const cleanExt = ext.toLowerCase().trim();
      if (cleanExt === 'step' || cleanExt === 'stp') {
        stepSize += size;
        stepCount += 1;
      } else if (cleanExt === 'pdf') {
        pdfSize += size;
        pdfCount += 1;
      } else if (cleanExt === 'dwg') {
        dwgSize += size;
        dwgCount += 1;
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(cleanExt)) {
        imageSize += size;
        imageCount += 1;
      } else {
        otherSize += size;
        otherCount += 1;
      }
    };

    // Components
    components.forEach(c => {
      if (c.fileSize) {
        compStats.size += c.fileSize;
        compStats.count += 1;
        const ext = c.fileName?.split('.').pop() || '';
        processFile(c.fileSize, ext);
      }
      if (c.stepFileSize) {
        compStats.size += c.stepFileSize;
        compStats.count += 1;
        processFile(c.stepFileSize, 'step');
      }
      if (c.pdfFileSize) {
        compStats.size += c.pdfFileSize;
        compStats.count += 1;
        processFile(c.pdfFileSize, 'pdf');
      }
      if (c.dwgFileSize) {
        compStats.size += c.dwgFileSize;
        compStats.count += 1;
        processFile(c.dwgFileSize, 'dwg');
      }
      if (c.complementaryFiles && c.complementaryFiles.length > 0) {
        c.complementaryFiles.forEach((f: any) => {
          if (f.size) {
            compStats.size += f.size;
            compStats.count += 1;
            const ext = f.name?.split('.').pop() || '';
            processFile(f.size, ext);
          }
        });
      }
    });

    // Documents
    documents.forEach(d => {
      if (d.fileSize) {
        docStats.size += d.fileSize;
        docStats.count += 1;
        const ext = d.fileName?.split('.').pop() || 'pdf';
        processFile(d.fileSize, ext);
      }
      if (d.complementaryFiles && d.complementaryFiles.length > 0) {
        d.complementaryFiles.forEach((f: any) => {
          if (f.size) {
            docStats.size += f.size;
            docStats.count += 1;
            const ext = f.name?.split('.').pop() || '';
            processFile(f.size, ext);
          }
        });
      }
    });

    // Standards
    standards.forEach(s => {
      if (s.fileSize) {
        stdStats.size += s.fileSize;
        stdStats.count += 1;
        const ext = s.fileName?.split('.').pop() || 'pdf';
        processFile(s.fileSize, ext);
      }
      if (s.complementaryFiles && s.complementaryFiles.length > 0) {
        s.complementaryFiles.forEach((f: any) => {
          if (f.size) {
            stdStats.size += f.size;
            stdStats.count += 1;
            const ext = f.name?.split('.').pop() || '';
            processFile(f.size, ext);
          }
        });
      }
    });

    return {
      totalSize,
      totalCount,
      stepSize,
      stepCount,
      pdfSize,
      pdfCount,
      dwgSize,
      dwgCount,
      imageSize,
      imageCount,
      otherSize,
      otherCount,
      compStats,
      docStats,
      stdStats
    };
  }, [components, documents, standards]);

  // Top 5 Largest Files List
  const largestFiles = React.useMemo(() => {
    const filesList: Array<{ name: string; size: number; module: string; details: string }> = [];

    components.forEach(c => {
      if (c.fileSize) {
        filesList.push({ name: c.fileName || c.name, size: c.fileSize, module: 'Componentes Homologados', details: `Componente: ${c.name}` });
      }
      if (c.stepFileSize) {
        filesList.push({ name: `${c.name} (STEP 3D)`, size: c.stepFileSize, module: 'Componentes Homologados', details: `Componente: ${c.name}` });
      }
      if (c.pdfFileSize) {
        filesList.push({ name: `${c.name} (PDF 2D)`, size: c.pdfFileSize, module: 'Componentes Homologados', details: `Componente: ${c.name}` });
      }
      if (c.dwgFileSize) {
        filesList.push({ name: `${c.name} (DWG 2D)`, size: c.dwgFileSize, module: 'Componentes Homologados', details: `Componente: ${c.name}` });
      }
      if (c.complementaryFiles && c.complementaryFiles.length > 0) {
        c.complementaryFiles.forEach((f: any) => {
          if (f.size) {
            filesList.push({ name: f.name, size: f.size, module: 'Componentes Homologados', details: `Anexo de: ${c.name}` });
          }
        });
      }
    });

    documents.forEach(d => {
      if (d.fileSize) {
        filesList.push({ name: d.fileName || d.title, size: d.fileSize, module: 'Cadernos de Encargos', details: `Documento: ${d.title}` });
      }
      if (d.complementaryFiles && d.complementaryFiles.length > 0) {
        d.complementaryFiles.forEach((f: any) => {
          if (f.size) {
            filesList.push({ name: f.name, size: f.size, module: 'Cadernos de Encargos', details: `Anexo de: ${d.title}` });
          }
        });
      }
    });

    standards.forEach(s => {
      if (s.fileSize) {
        filesList.push({ name: s.fileName || s.title, size: s.fileSize, module: 'Normas Técnicas', details: `Norma: ${s.title}` });
      }
      if (s.complementaryFiles && s.complementaryFiles.length > 0) {
        s.complementaryFiles.forEach((f: any) => {
          if (f.size) {
            filesList.push({ name: f.name, size: f.size, module: 'Normas Técnicas', details: `Anexo de: ${s.title}` });
          }
        });
      }
    });

    return filesList.sort((a, b) => b.size - a.size).slice(0, 5);
  }, [components, documents, standards]);

  // Soft threshold calculation (let's say 1 GB limit for free/standard Master storage)
  const maxStorageLimit = 1024 * 1024 * 1024; // 1 GB in bytes
  const usagePercentage = Math.min((storageStats.totalSize / maxStorageLimit) * 100, 100);

  return (
    <div className="space-y-6 max-w-[800px] mx-auto text-left">
      {/* Header section */}
      <div className="bg-gradient-to-r from-[#06242c] to-[#0b3b47] text-white p-8 rounded-2xl border border-teal-950 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-[26px] font-extrabold tracking-tight">Configurações do Master</h2>
          <p className="text-slate-300 mt-2 text-[14px] max-w-[650px] leading-relaxed">
            Gerencie credenciais administrativas, consumo de storage e controle de armazenamento da organização.
          </p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        
        {/* Profile Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            Perfil Administrativo
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs max-w-md bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-500 font-medium">E-mail:</span>
              <p className="font-bold text-slate-800 mt-0.5">{user?.email || cleanEnvVar(import.meta.env.MASTER_EMAIL || import.meta.env.VITE_MASTER_EMAIL) || 'perspec03d@gmail.com'}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Permissões:</span>
              <p className="font-bold text-teal-600 mt-0.5">Acesso Total (Master)</p>
            </div>
          </div>
        </div>

        <hr className="border-slate-150" />

        {/* Storage Dashboard Panel */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-teal-600" />
              Controle de Armazenamento de Arquivos
            </h3>
            
            <div className="flex bg-slate-150 p-0.5 rounded-lg text-xs font-bold border border-slate-250">
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`px-3 py-1 rounded-md transition-all ${activeTab === 'overview' ? 'bg-white text-teal-655 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Geral
              </button>
              <button 
                onClick={() => setActiveTab('details')} 
                className={`px-3 py-1 rounded-md transition-all ${activeTab === 'details' ? 'bg-white text-teal-655 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Detalhamento
              </button>
            </div>
          </div>

          {activeTab === 'overview' ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Progress Card */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                <div className="space-y-2 flex-1 w-full">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Uso Total Conhecido</span>
                    <span className="font-mono text-teal-650">{formatSize(storageStats.totalSize)} / {formatSize(maxStorageLimit)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${usagePercentage > 85 ? 'bg-red-500' : usagePercentage > 60 ? 'bg-amber-500' : 'bg-teal-500'}`}
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-450 font-bold uppercase">
                    <span>{storageStats.totalCount} arquivos registrados</span>
                    <span>{usagePercentage.toFixed(1)}% do limite soft</span>
                  </div>
                </div>
              </div>

              {/* Grid cards per Extension */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Arquivos STEP</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-extrabold text-slate-800">{formatSize(storageStats.stepSize)}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{storageStats.stepCount} un</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Documentos PDF</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-extrabold text-slate-800">{formatSize(storageStats.pdfSize)}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{storageStats.pdfCount} un</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Modelos DWG</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-extrabold text-slate-800">{formatSize(storageStats.dwgSize)}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{storageStats.dwgCount} un</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Imagens / Outros</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-extrabold text-slate-800">{formatSize(storageStats.imageSize + storageStats.otherSize)}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{storageStats.imageCount + storageStats.otherCount} un</span>
                  </div>
                </div>
              </div>

              {/* Top 5 largest files list */}
              <div className="space-y-2.5">
                <span className="text-[10.5px] font-extrabold text-slate-450 uppercase tracking-wider block">
                  Maiores Arquivos Armazenados
                </span>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {largestFiles.length > 0 ? (
                    largestFiles.map((fileObj, idx) => (
                      <div key={idx} className="p-3.5 flex justify-between items-center text-xs">
                        <div className="space-y-0.5 max-w-[70%] text-left">
                          <span className="font-bold text-slate-850 truncate block" title={fileObj.name}>
                            {fileObj.name}
                          </span>
                          <span className="text-[10px] text-slate-455 font-semibold block">
                            {fileObj.module} &bull; {fileObj.details}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded shrink-0">
                          {formatSize(fileObj.size)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 italic">
                      Nenhum arquivo cadastrado nas coleções até o momento.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs">
              <span className="text-[10.5px] font-extrabold text-slate-455 uppercase tracking-wider block">
                Consumo por Módulo
              </span>

              {/* Accordion or list breakdown by Module */}
              <div className="space-y-3">
                {/* Components Module Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-50 border border-teal-100 text-teal-650 rounded-lg flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">Componentes Homologados</span>
                      <span className="text-[10px] text-slate-455 font-bold uppercase">{storageStats.compStats.count} referências de arquivos</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-800 bg-white border border-slate-250 px-2.5 py-1 rounded-lg text-xs shadow-sm">
                    {formatSize(storageStats.compStats.size)}
                  </span>
                </div>

                {/* Documents Module Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-50 border border-teal-100 text-teal-650 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">Cadernos de Encargos</span>
                      <span className="text-[10px] text-slate-455 font-bold uppercase">{storageStats.docStats.count} arquivos registrados</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-800 bg-white border border-slate-250 px-2.5 py-1 rounded-lg text-xs shadow-sm">
                    {formatSize(storageStats.docStats.size)}
                  </span>
                </div>

                {/* Standards Module Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-50 border border-purple-100 text-purple-655 rounded-lg flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">Normas & Diretrizes Técnicas</span>
                      <span className="text-[10px] text-slate-455 font-bold uppercase">{storageStats.stdStats.count} arquivos registrados</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-800 bg-white border border-slate-250 px-2.5 py-1 rounded-lg text-xs shadow-sm">
                    {formatSize(storageStats.stdStats.size)}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
