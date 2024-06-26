'use client'

import * as THREE from 'three';
import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { suspend } from 'suspend-react';
import { AccumulativeShadows, RandomizedLight, Center, Environment, OrbitControls } from '@react-three/drei'

export default function Home(props) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [-1, 1, 2], fov: 10 }}>
      <spotLight position={[-4, 4, -4]} angle={0.04} penumbra={1} castShadow shadow-mapSize={[2048, 2048]} />
      <Suspense fallback={null}>
        <Track />
      </Suspense>
      {/* <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
        <planeGeometry />
        <shadowMaterial transparent opacity={0.15} />
      </mesh> */}
    </Canvas>
  );
}

function Track({ y = 2500, space = 1.8, radius = 0.1, obj = new THREE.Object3D(), ...props }) {
  const ref = useRef();
  const { context, update, data } = suspend(() => createAudio(), []);
  
  // Variables for decay and smoothing
  let smoothAvg = 0;
  const decayFactor = 0.97;

  useFrame(() => {
    let avg = update();

    // Apply exponential smoothing
    smoothAvg = avg * (1 - decayFactor) + smoothAvg * decayFactor;

    obj.position.set(0, smoothAvg / y, 0);
    obj.updateMatrix();
    ref.current.setMatrixAt(0, obj.matrix);
    ref.current.material.color.setHSL(smoothAvg / 360, 0.75, 0.75);
    ref.current.instanceMatrix.needsUpdate = true;
    console.log(ref)
  });

  return (
    <instancedMesh castShadow ref={ref} args={[null, null, 1]} {...props}>
      <sphereGeometry args={[radius, 32, 32]} />
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



