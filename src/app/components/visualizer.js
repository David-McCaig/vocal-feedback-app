'use client'

import * as THREE from 'three';
import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { suspend } from 'suspend-react';

export default function Home(props) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [-1, 1.5, 2], fov: 25 }}>
      <spotLight position={[-4, 4, -4]} angle={0.06} penumbra={1} castShadow shadow-mapSize={[2048, 2048]} />
      <Suspense fallback={null}>
        <Track />
      </Suspense>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
        <planeGeometry />
        <shadowMaterial transparent opacity={0.15} />
      </mesh>
    </Canvas>
  );
}

function Track({ y = 2500, space = 1.8, width = 0.01, height = 0.05, obj = new THREE.Object3D(), ...props }) {
  const ref = useRef();
  const { gain, context, update, data } = suspend(() => createAudio(), []);

//   useEffect(() => {
//     gain.connect(context.destination);
//     return () => gain.disconnect();
//   }, [gain, context]);

  useFrame((state) => {
    let avg = update();
    for (let i = 0; i < data.length; i++) {
      obj.position.set(i * width * space - (data.length * width * space) / 2, data[i] / y, 0);
      obj.updateMatrix();
      ref.current.setMatrixAt(i, obj.matrix);
    }
    ref.current.material.color.setHSL(avg / 360, 0.75, 0.75);
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh castShadow ref={ref} args={[null, null, data.length]} {...props}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

async function createAudio() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const source = context.createMediaStreamSource(stream);

  const analyser = context.createAnalyser();
  analyser.fftSize = 64;
  source.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);
  return {
    context,
    source,
  
    data,
    update: () => {
      analyser.getByteFrequencyData(data);
      return (data.avg = data.reduce((prev, cur) => prev + cur / data.length, 0));
    },
  };
}
