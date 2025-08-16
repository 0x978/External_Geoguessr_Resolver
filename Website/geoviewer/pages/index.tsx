import { useEffect, useRef, useState } from 'react';

type Coords = {
  lat: number;
  lng: number;
  timestamp: number;
  sessionId: string;
};

type location = {
    country: string;
    town: string;
    village: string;
    state: string;
    road: string;
    county: string;
    postcode: string;
    city: string;
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string>('');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState<location | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const socket = new WebSocket(`wss://${location.host}/ws/${sessionId}`);
    // const socket = new WebSocket(`ws://localhost:8000/ws/${sessionId}`); // Local dev
    wsRef.current = socket;

    socket.onopen = () => console.log('connected');
    socket.onerror = err => console.error('ws error:', err);
    socket.onmessage = e => {
      try {
        const data: Coords = JSON.parse(e.data);
        setCoords(data);
        setLocationFromCoords(data.lat, data.lng);
      } catch (err) {
        console.error('bad data', err);
      }
    };

    return () => socket.close();
  }, [sessionId]);

  function openInMaps() {
    window.open(`https://maps.google.com/?output=embed&q=${coords?.lat},${coords?.lng}&ll=${coords?.lat},${coords?.lng}&z=5`)
  }

  async function setLocationFromCoords(lat: number, lon: number): Promise<void> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url, {
      headers: {
          'User-Agent': 'GeoResolver',
          'Accept-Language': 'en'
      }
    });
    const data = await res.json();
    const { city, town, village, state, country, road, county, postcode } = data.address;
    const location: location = {
      city: city,
      town: town,
      village: village,
      state: state,
      road: road,
      county: county,
      postcode: postcode,
      country: country,
    };
    setResolvedLocation(location)
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
                <div><b>Time:</b> {new Date(coords.timestamp * 1000).toLocaleTimeString()}
                { resolvedLocation &&
                    <>
                        <div><b>country:</b> {resolvedLocation.country}</div>
                        <div><b>state:</b> {resolvedLocation.state}</div>
                        <div><b>county:</b> {resolvedLocation.county}</div>
                        <div><b>city:</b> {resolvedLocation.city}</div>
                        <div><b>town:</b> {resolvedLocation.town}</div>
                        <div><b>village:</b> {resolvedLocation.village}</div>
                        <div><b>road:</b> {resolvedLocation.road}</div>
                        <div><b>postcode:</b> {resolvedLocation.postcode}</div>
                    </>
                }
                </div>
              </>
          ) : (
              <div>No coordinates received yet.
              </div>
          )}
        </div>
        <button className="w-64 h-16 rounded-xl bg-gray-300 text-black cursor-pointer" onClick={() => openInMaps()} >Google Maps</button>
      </main>
  );
}
