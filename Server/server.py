import os
from collections import defaultdict
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
import uvicorn
import json
import time
import mysql.connector
import requests
import asyncio
import logging

app = FastAPI()
latest_coords = {}
clients = defaultdict(set)


app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("georesolver")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.geoguessr.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept() # Accept incoming ws connection
    clients[session_id].add(websocket) # Add to dict of clients

    ip_address = websocket.headers.get("x-forwarded-for") or websocket.client.host
    headers = dict(websocket.headers)
    origin = headers.get("origin")
    user_agent = headers.get("user-agent")

    asyncio.create_task(
        asyncio.to_thread(log_ws_connection, session_id, ip_address, origin, user_agent)
    )

    if session_id in latest_coords:
        await websocket.send_text(json.dumps(latest_coords[session_id]))

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients[session_id].remove(websocket)


# Receives coords from JS extension
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

    logger.info(f"coords received for {session_id}: {res}")

    # Updates coords dict with coord info
    latest_coords[session_id] = res

    # Send new coords info received to each ws connection with matching sessionId
    for client in clients[session_id].copy():
        try:
            await client.send_text(json.dumps(res))
        except:
            clients[session_id].remove(client)

    return {"status": "ok"}


def log_ws_connection(session_id, ip_address, origin=None, user_agent=None):
    conn = mysql.connector.connect(  # TODO remember to set these details in VPS
        host= os.getenv("DB_HOST", "localhost"),
        user= os.getenv("DB_USER", "root"),
        password= os.getenv("DB_PASSWORD", "root"),
        database= os.getenv("DB_NAME", "usage_tracking"),
    )
    cursor = conn.cursor()
    country, city = get_country_from_ip(ip_address)
    logger.info(f"Websocket connection successful for {session_id} from {city}, {country}")

    cursor.execute('''
            INSERT INTO websocket_connections (session_id, ip_address, country, city, origin, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (session_id, ip_address, country, city, origin, user_agent))

    conn.commit()
    cursor.close()
    conn.close()

def get_country_from_ip(ip_address):
    try:
        response = requests.get(f'http://ip-api.com/json/{ip_address}', timeout=5)
        if response.status_code == 200:
            data = response.json()
            country = data.get('country', 'Unknown')
            city = data.get('city', 'Unknown')
            return country, city
    except Exception:
        pass
    return "Unknown", "Unknown"


if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000)
