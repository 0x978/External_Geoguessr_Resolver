from collections import defaultdict
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
import uvicorn
import json
import time

app = FastAPI()
latest_coords = {}
clients = defaultdict(set)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.geoguessr.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    clients[session_id].add(websocket)

    if session_id in latest_coords:
        await websocket.send_text(json.dumps(latest_coords[session_id]))

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients[session_id].remove(websocket)


@app.post("/coords")
async def update_coords(request: Request):
    data = await request.json()
    session_id = data.get("sessionId")
    if not session_id:
        return {"error": "Missing sessionId"}

    res = {
        "lat": data.get("lat"),
        "lng": data.get("lng"),
        "timestamp": time.time(),
        "sessionId": session_id,
    }

    latest_coords[session_id] = res

    for client in clients[session_id].copy():
        try:
            await client.send_text(json.dumps(res))
        except:
            clients[session_id].remove(client)

    return {"status": "ok"}



if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000)
