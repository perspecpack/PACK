import React, { useRef, useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface ThreeDViewerProps {
  url: string;
  poster?: string;
  alt?: string;
}

const THREE_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const STL_LOADER_URL = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/STLLoader.js';
const ORBIT_CONTROLS_URL = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
};

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ url, poster, alt }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isStl = url.toLowerCase().endsWith('.stl');

  useEffect(() => {
    if (!isStl) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let animationFrameId: number;
    let controls: any;
    let renderer: any;
    let handleResize: () => void;

    const initThree = async () => {
      try {
        // Load Scripts Sequentially
        await loadScript(THREE_JS_URL);
        await loadScript(STL_LOADER_URL);
        await loadScript(ORBIT_CONTROLS_URL);

        if (!isMounted) return;

        const THREE = (window as any).THREE;
        if (!THREE || !THREE.STLLoader || !THREE.OrbitControls) {
          throw new Error('Bibliotecas 3D não puderam ser inicializadas.');
        }

        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight || 350;

        // Create scene
        const scene = new THREE.Scene();

        // Create camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);

        // Create controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x444444);
        scene.add(ambientLight);

        // Key light (top-right-front)
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight1.position.set(2, 3, 2).normalize();
        scene.add(dirLight1);

        // Fill light (bottom-left-back)
        const dirLight2 = new THREE.DirectionalLight(0x94a3b8, 0.3);
        dirLight2.position.set(-2, -1, -2).normalize();
        scene.add(dirLight2);

        // Top down rim light for highlighted edges
        const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.45);
        dirLight3.position.set(0, 4, 0).normalize();
        scene.add(dirLight3);

        // Load STL
        const loader = new THREE.STLLoader();
        loader.load(
          url,
          (geometry: any) => {
            if (!isMounted) return;

            // Center geometry
            geometry.center();

            // Compute smooth vertex normals for proper lighting/shadows!
            geometry.computeVertexNormals();

            // Premium light gray steel material visible under all lighting
            const material = new THREE.MeshStandardMaterial({
              color: 0x7e8b9b, // Cool gray-steel
              metalness: 0.2,   // low metalness to prevent black reflections
              roughness: 0.4,   // medium-low roughness for clear shading structure
              shadowSide: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);

            // Compute bounding sphere to frame the camera
            geometry.computeBoundingSphere();
            const sphere = geometry.boundingSphere;
            const radius = sphere.radius;

            // Position camera based on radius
            camera.position.set(radius * 2, radius * 1.5, radius * 2);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();

            scene.add(mesh);
            setIsLoading(false);
          },
          (xhr: any) => {
            if (xhr.total && isMounted) {
              setProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          (err: any) => {
            console.error('Error loading STL:', err);
            if (isMounted) {
              setError('Não foi possível ler o arquivo STL. Verifique o formato do arquivo.');
              setIsLoading(false);
            }
          }
        );

        // Animation Loop
        const animate = () => {
          if (!isMounted) return;
          animationFrameId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        // Resize handler
        handleResize = () => {
          if (!container || !renderer) return;
          const w = container.clientWidth;
          const h = container.clientHeight || 350;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

      } catch (err: any) {
        console.error('Three.js init failed:', err);
        if (isMounted) {
          setError(err?.message || 'Falha ao inicializar renderizador 3D.');
          setIsLoading(false);
        }
      }
    };

    initThree();

    return () => {
      isMounted = false;
      if (handleResize) {
        window.removeEventListener('resize', handleResize);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (controls) {
        controls.dispose();
      }
      if (renderer) {
        renderer.dispose();
        if (containerRef.current && renderer.domElement) {
          try {
            containerRef.current.removeChild(renderer.domElement);
          } catch (e) {
            // Element might already be removed
          }
        }
      }
    };
  }, [url, isStl]);

  if (!isStl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative min-h-[350px] bg-gradient-to-br from-slate-50 to-slate-200 rounded-2xl overflow-hidden border border-slate-200/80 shadow-lg text-left">
        <span className="absolute top-2 left-2 bg-[#0c3944]/80 text-[#00F59B] text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-teal-500/20 uppercase tracking-wider z-10 flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          Visualização 3D GLB
        </span>
        <model-viewer
          src={url}
          poster={poster || ''}
          camera-controls
          auto-rotate
          shadow-intensity="1"
          alt={alt || 'Modelo 3D'}
          touch-action="pan-y"
          style={{ width: '100%', height: '380px', outline: 'none', backgroundColor: 'transparent' }}
        ></model-viewer>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative min-h-[350px] bg-gradient-to-br from-slate-50 to-slate-200 rounded-2xl overflow-hidden border border-slate-200/80 shadow-lg text-left">
      <span className="absolute top-2 left-2 bg-[#0c3944]/80 text-[#00F59B] text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-teal-500/20 uppercase tracking-wider z-10 flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
        </span>
        Visualização 3D STL
      </span>

      {isLoading && (
        <div className="absolute inset-0 bg-slate-50/95 flex flex-col items-center justify-center gap-3 z-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-650" />
          <span className="text-xs text-slate-650 font-bold uppercase tracking-wider">
            {progress > 0 ? `Carregando Modelo... ${progress}%` : 'Inicializando Renderizador...'}
          </span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-slate-50/95 flex flex-col items-center justify-center gap-3 p-6 text-center z-20">
          <AlertCircle className="w-8 h-8 text-rose-600" />
          <span className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg max-w-xs leading-normal font-semibold">
            {error}
          </span>
        </div>
      )}

      {/* Container where WebGL renderer.domElement will be appended */}
      <div 
        ref={containerRef} 
        className="w-full h-[380px] cursor-grab active:cursor-grabbing" 
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
