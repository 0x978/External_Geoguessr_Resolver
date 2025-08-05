import { useEffect, useRef, useState } from 'react';

type Coords = {
  lat: number;
  lng: number;
  timestamp: number;
  sessionId: string;
};

export default function Home() {
  const [sessionId, setSessionId] = useState<string>('');
  const [coords, setCoords] = useState<Coords | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const socket = new WebSocket(`wss://${location.host}/ws/${sessionId}`);
    wsRef.current = socket;

    socket.onopen = () => console.log('connected');
    socket.onerror = err => console.error('ws error:', err);
    socket.onmessage = e => {
      try {
        const data: Coords = JSON.parse(e.data);
        setCoords(data);
      } catch (err) {
        console.error('bad data', err);
      }
    };

    return () => socket.close();
  }, [sessionId]);

  function openInMaps() {
    window.open(`https://maps.google.com/?output=embed&q=${coords?.lat},${coords?.lng}&ll=${coords?.lat},${coords?.lng}&z=5`)
  }

  return (
      <main className="flex flex-col gap-10 " style={{ fontFamily: 'sans-serif', padding: 32 }}>
        <h2>GeoGuessr Live Viewer</h2>
        <input
            placeholder="Session ID"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            style={{ padding: 8, fontSize: 16 }}
        />
        <div style={{ marginTop: 24 }}>
          {coords ? (
              <>
                <div><b>Lat:</b> {coords.lat}</div>
                <div><b>Lng:</b> {coords.lng}</div>
                <div><b>Time:</b> {new Date(coords.timestamp * 1000).toLocaleTimeString()}</div>
              </>
          ) : (
              <div>No coordinates received yet.</div>
          )}
        </div>
        <button className="w-64 h-16 rounded-xl bg-gray-300 text-black cursor-pointer" onClick={() => openInMaps()} >Google Maps</button>
      </main>
  );
}
