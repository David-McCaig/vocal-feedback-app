"use client";

import * as THREE from "three";
import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { suspend } from "suspend-react";
import {
  Environment,
  OrbitControls,
  Center,
  Plane,
  AccumulativeShadows,
  RandomizedLight,
} from "@react-three/drei";

export default function Home(props) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [-4, 15, 3], fov: 20 }}>
      <Center middle>
        <color attach="background" args={["#e0e0e0"]} />
        <Suspense fallback={null}>
          <Environment preset="sunset" background={false} />
          <OrbitControls />
          <Track position={[0, 1.1, 0]} />
          <Plane
            receiveShadow
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -1, 0]}
            args={[10, 10]}
          >
            <shadowMaterial transparent opacity={0.4} />
          </Plane>
          <AccumulativeShadows
            temporal
            frames={200}
            color="purple"
            colorBlend={0.5}
            opacity={1}
            scale={10}
            alphaTest={0.85}
          >
            <RandomizedLight
              amount={8}
              radius={5}
              ambient={0.5}
              position={[5, 3, 2]}
              bias={0.001}
            />
          </AccumulativeShadows>
        </Suspense>
        <OrbitControls
          autoRotateSpeed={4}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2.1}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Center>
    </Canvas>
  );
}

function Track({ radius = 1, ...props }) {
  const ref = useRef();
  const { update } = suspend(() => createAudio(), []);

  let smoothAvg = 0;
  const decayFactor = 0.97;

  useFrame(() => {
    let avg = update();
    smoothAvg = avg * (1 - decayFactor) + smoothAvg * decayFactor;
    ref.current.scale.setScalar(1 + smoothAvg / 500);

    // More vibrant color calculation
    const hue = (smoothAvg / 255) * 360; // Full hue range
    const saturation = 1; // Maximum saturation
    const lightness = 0.5; // Mid-range lightness for vibrant colors
    ref.current.material.color.setHSL(hue / 360, saturation, lightness);
  });

  return (
    <mesh ref={ref} castShadow {...props}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshPhysicalMaterial
        metalness={0.1}
        roughness={0.3}
        envMapIntensity={1}
        clearcoat={2}
        clearcoatRoughness={0.2}
      />
    </mesh>
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
      return (data.avg = data.reduce(
        (prev, cur) => prev + cur / data.length,
        0
      ));
    },
  };
}
