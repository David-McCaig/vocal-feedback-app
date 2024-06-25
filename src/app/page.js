'use client';

import Visualizer from './components/visualizer'

import { useState } from 'react';

export default function Home() {
  const [ready, set] = useState(false)

  return (
    <>
      {ready && <Visualizer />}
      <div className={`fullscreen bg ${ready ? 'ready' : 'notready'} ${ready && 'clicked'}`}>
        <div className="stack">
          <button onClick={() => set(true)}>▶️</button>
        </div>
      </div>
    </>
  );
}
