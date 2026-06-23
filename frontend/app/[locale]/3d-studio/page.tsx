"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

type RenderMode = 'mesh' | 'points';

// The 3D Mesh Component
function DepthMapMesh({ imageUrl, depthUrl }: { imageUrl: string, depthUrl: string }) {
  const colorMap = useLoader(THREE.TextureLoader, imageUrl);
  const depthMap = useLoader(THREE.TextureLoader, depthUrl);

  // Calculate aspect ratio
  const aspect = colorMap.image.width / colorMap.image.height;
  const width = aspect > 1 ? 5 : 5 * aspect;
  const height = aspect > 1 ? 5 / aspect : 5;

  return (
    <mesh position={[0, 0, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
      {/* High segment count is needed for displacement map to work */}
      <planeGeometry args={[width, height, 512, 512]} />
      <meshStandardMaterial
        map={colorMap}
        displacementMap={depthMap}
        displacementScale={0.5} // Adjust depth strength
        displacementBias={-0.25} // Center the depth
        side={THREE.DoubleSide}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
}

// The Point Cloud Component
function DepthPointCloud({ imageUrl, depthUrl }: { imageUrl: string, depthUrl: string }) {
  const colorMap = useLoader(THREE.TextureLoader, imageUrl);
  const depthMap = useLoader(THREE.TextureLoader, depthUrl);

  const aspect = colorMap.image.width / colorMap.image.height;
  const width = aspect > 1 ? 5 : 5 * aspect;
  const height = aspect > 1 ? 5 / aspect : 5;

  const shaderArgs = {
    uniforms: {
      colorTex: { value: colorMap },
      depthTex: { value: depthMap },
      displacementScale: { value: 0.5 },
      displacementBias: { value: -0.25 },
    },
    vertexShader: `
      uniform sampler2D depthTex;
      uniform float displacementScale;
      uniform float displacementBias;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 depthPixel = texture2D(depthTex, uv);
        float z = (depthPixel.r + displacementBias) * displacementScale;
        vec3 newPosition = position + vec3(0.0, 0.0, z);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        gl_PointSize = 2.0;
      }
    `,
    fragmentShader: `
      uniform sampler2D colorTex;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(colorTex, vUv);
        gl_FragColor = color;
      }
    `,
  };

  return (
    <points position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <planeGeometry args={[width, height, 512, 512]} />
      <shaderMaterial args={[shaderArgs]} />
    </points>
  );
}

export default function ThreeDStudio() {
  const [renderMode, setRenderMode] = useState<RenderMode>('mesh');
  const [imageRef, setImageRef] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  
  const [depthMapUrl, setDepthMapUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize the Web Worker
    workerRef.current = new Worker(new URL('./depth-worker.ts', import.meta.url), {
      type: 'module'
    });

    workerRef.current.onmessage = (event) => {
      const { status, progress, depthMap, depthData, width, height, channels, error } = event.data;

      if (status === "init") {
        setStatusText("Loading AI Model...");
      } else if (status === "progress") {
        // e.g. { file: '...', status: 'progress', progress: 50 }
        if (progress?.status === 'downloading') {
           setStatusText(`Downloading Weights... ${Math.round(progress.progress)}%`);
           setProgress(progress.progress);
        } else if (typeof progress === 'number') {
           setProgress(progress);
        }
      } else if (status === "processing") {
        setStatusText("Running Depth Estimation...");
        setProgress(100);
      } else if (status === "complete") {
        if (depthData && width && height) {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const rgbaData = new Uint8ClampedArray(width * height * 4);
            if (channels === 1 || !channels) {
              for (let i = 0; i < depthData.length; i++) {
                const val = depthData[i];
                rgbaData[i * 4] = val;
                rgbaData[i * 4 + 1] = val;
                rgbaData[i * 4 + 2] = val;
                rgbaData[i * 4 + 3] = 255;
              }
            } else if (channels === 3) {
              for (let i = 0; i < (width * height); i++) {
                rgbaData[i * 4] = depthData[i * 3];
                rgbaData[i * 4 + 1] = depthData[i * 3 + 1];
                rgbaData[i * 4 + 2] = depthData[i * 3 + 2];
                rgbaData[i * 4 + 3] = 255;
              }
            } else if (channels === 4) {
              rgbaData.set(depthData);
            }
            const imageData = new ImageData(rgbaData, width, height);
            ctx.putImageData(imageData, 0, 0);
            setDepthMapUrl(canvas.toDataURL("image/png"));
          }
        } else if (depthMap) {
          setDepthMapUrl(depthMap);
        }
        setIsGenerating(false);
        setStatusText("Complete!");
      } else if (status === "error") {
        console.error("Worker Error:", error);
        setStatusText("Error: " + error);
        setIsGenerating(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setImageRef(url);
      setDepthMapUrl(null); // Reset
    }
  };

  const startGeneration = () => {
    if (!imageRef) return;

    setIsGenerating(true);
    setProgress(0);
    setDepthMapUrl(null);
    setStatusText("Initializing Local AI...");

    // Send the image URL to the worker for processing
    workerRef.current?.postMessage({ action: "estimate_depth", image: imageRef });
  };


  return (
    <div className="h-screen w-full flex flex-col bg-[#050505] p-2 md:p-4 md:space-y-4 space-y-2 text-white font-sans overflow-hidden animate-fade-in">
      
      {/* Header */}
      <header className="flex justify-between items-center h-12 shrink-0 border-b border-[#262626] pb-2">
        <div className="flex items-center space-x-4">
          <Link href="/" className="bento-btn w-10 h-10 flex items-center justify-center text-[#a1a1aa] hover:text-white">
            <i className="fas fa-arrow-left text-sm"></i>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold flex items-center">
              Nexus_3D_Studio <i className="fas fa-cube ml-2 text-[10px] text-purple-400"></i>
            </h1>
            <span className="text-[10px] text-purple-400 font-bold hidden md:block">Local AI Depth Engine</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-green-400 font-mono mr-4"><i className="fas fa-bolt text-yellow-500 mr-1"></i> Cost: $0 (Local Inference)</span>
          <button className="bento-btn-accent px-4 py-1 text-xs"><i className="fas fa-download mr-2"></i> Export .glb</button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 min-h-0 relative">
        
        {/* Left: Input Panel */}
        <aside className="w-full md:w-80 bento-card flex flex-col shrink-0 bg-[#0a0a0a]">
          <div className="p-4 border-b border-[#262626]">
            <h2 className="text-sm font-bold flex items-center"><i className="fas fa-magic text-purple-400 mr-2"></i> Image to 3D</h2>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-6">
            
            {/* Input Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#a1a1aa]">Reference Image</label>
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
              {!imageRef ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-[#3f3f46] rounded-xl flex flex-col items-center justify-center text-[#a1a1aa] hover:border-purple-500 hover:text-purple-400 transition-colors cursor-pointer bg-[#141414]"
                >
                  <i className="fas fa-image text-2xl mb-2"></i>
                  <span className="text-xs font-bold">Click or Drag to Upload</span>
                </div>
              ) : (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#262626] group">
                  <img src={imageRef} alt="Reference" className="w-full h-full object-cover opacity-80" />
                  <button 
                    onClick={() => setImageRef(null)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fas fa-times text-[10px]"></i>
                  </button>
                </div>
              )}
            </div>


            {/* Advanced Settings */}
            <div className="space-y-3 pt-4 border-t border-[#262626]">
              <div className="flex flex-col space-y-2">
                <span className="text-[#a1a1aa] font-bold text-xs">Render Style</span>
                <div className="flex bg-[#141414] rounded-lg p-1 border border-[#262626]">
                  <button onClick={() => setRenderMode('mesh')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${renderMode === 'mesh' ? 'bg-[#262626] text-white' : 'text-[#a1a1aa]'}`}>Mesh</button>
                  <button onClick={() => setRenderMode('points')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${renderMode === 'points' ? 'bg-[#262626] text-white' : 'text-[#a1a1aa]'}`}>Point Cloud</button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#a1a1aa] font-bold">AI Model</span>
                <span className="font-mono text-purple-400 text-[9px]">DepthAnything (Small)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#a1a1aa] font-bold">Topology Density</span>
                <span className="font-mono text-purple-400">Quad (512x512)</span>
              </div>
            </div>

          </div>

          <div className="p-4 border-t border-[#262626]">
             <button 
               onClick={startGeneration}
               disabled={isGenerating || !imageRef}
               className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center group"
             >
               {isGenerating ? (
                 <><i className="fas fa-circle-notch fa-spin mr-2"></i> Generating 3D...</>
               ) : (
                 <><i className="fas fa-cube mr-2 group-hover:rotate-180 transition-transform duration-500"></i> Generate 3D (Local)</>
               )}
             </button>
          </div>
        </aside>

        {/* Center: 3D Viewer */}
        <main className="flex-1 bento-card flex flex-col relative overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-[#050505] border border-[#262626] shadow-inner">
          
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#262626 1px, transparent 1px), linear-gradient(90deg, #262626 1px, transparent 1px)', backgroundSize: '40px 40px', transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(3)' }}></div>

          {/* Viewport Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            
            {/* State 1: Empty */}
            {!isGenerating && !depthMapUrl && (
              <div className="text-center text-[#3f3f46] animate-pulse">
                <i className="fas fa-cubes text-6xl mb-4 opacity-50"></i>
                <p className="font-mono text-sm">Upload an Image to Begin</p>
              </div>
            )}

            {/* State 2: Generating (Loading Animation) */}
            {isGenerating && (
              <div className="flex flex-col items-center z-10 w-full max-w-md px-8">
                <div className="w-32 h-32 mb-8 relative">
                   <div className="absolute inset-0 border-4 border-purple-500/30 rounded-lg animate-spin-slow"></div>
                   <div className="absolute inset-0 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-lg animate-spin"></div>
                   <i className="fas fa-brain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-pulse"></i>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{statusText}</h3>
                <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#262626]">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="font-mono text-xs text-[#a1a1aa] mt-2 text-right w-full">{progress.toFixed(0)}%</p>
              </div>
            )}

            {/* State 3: Generated 3D Mesh */}
            {depthMapUrl && imageRef && !isGenerating && (
              <div className="absolute inset-0 z-10 cursor-move bg-[#282828]">
                <Canvas shadows camera={{ position: [0, 0, 8], fov: 45 }}>
                  <gridHelper args={[20, 20, '#555555', '#444444']} />
                  <axesHelper args={[5]} />
                  
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
                  <pointLight position={[-10, -10, -5]} intensity={0.5} />
                  
                  {renderMode === 'mesh' ? (
                    <DepthMapMesh imageUrl={imageRef} depthUrl={depthMapUrl} />
                  ) : (
                    <DepthPointCloud imageUrl={imageRef} depthUrl={depthMapUrl} />
                  )}
                  
                  <OrbitControls 
                    makeDefault
                    enablePan={true} 
                    enableZoom={true} 
                    enableRotate={true}
                    minDistance={1}
                    maxDistance={20}
                    enableDamping
                    dampingFactor={0.05}
                  />
                  <Environment preset="city" />
                </Canvas>
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#141414]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#262626] flex items-center space-x-4 shadow-xl">
                   <div className="flex items-center">
                     <span className="text-[10px] text-gray-400 mr-2">Original</span>
                     <img src={imageRef} className="h-8 w-8 object-cover rounded border border-gray-600" />
                   </div>
                   <div className="flex items-center">
                     <span className="text-[10px] text-gray-400 mr-2">Depth Map</span>
                     <img src={depthMapUrl} className="h-8 w-8 object-cover rounded border border-purple-500" />
                   </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
