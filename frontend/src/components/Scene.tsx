"use client";
import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';

function FloatingShapes() {
  const count = 20;
  const shapes = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: [
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15 - 5
      ] as [number, number, number],
      scale: Math.random() * 0.8 + 0.3,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
      color: Math.random() > 0.5 ? '#8b5cf6' : '#d946ef' // violet or fuchsia
    }));
  }, []);

  return (
    <>
      {shapes.map((shape, i) => (
        <Float key={i} speed={2} rotationIntensity={2} floatIntensity={2}>
          <Icosahedron args={[1, 0]} position={shape.position} scale={shape.scale} rotation={shape.rotation}>
            <meshStandardMaterial 
              color={shape.color} 
              emissive={shape.color} 
              emissiveIntensity={0.6} 
              wireframe 
            />
          </Icosahedron>
        </Float>
      ))}
    </>
  );
}

function Starfield() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001; // Constant slow rotation
      
      const targetX = (state.pointer.x * Math.PI) / 8;
      const targetY = (state.pointer.y * Math.PI) / 8;
      
      // Smoothly interpolate towards mouse position
      groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.02;
      groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <Stars radius={100} depth={50} count={4000} factor={4} saturation={0} fade speed={1} />
      <FloatingShapes />
    </group>
  );
}

export default function Scene() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 75 }} eventSource={typeof document !== 'undefined' ? document.body : undefined} eventPrefix="client">
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#8b5cf6" />
        <Starfield />
      </Canvas>
    </div>
  );
}

