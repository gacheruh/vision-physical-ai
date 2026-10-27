from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import os
import sqlite3
import pandas as pd
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vision-physical-ai-service")

app = FastAPI(
    title="Vision-Based Physical AI & Autonomous Navigation API",
    version="1.0.0",
    description="Computer vision object classification, spatial coordinate calculation, and robotics command generation."
)

DB_PATH = os.getenv("DB_PATH", "vision_navigation.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS navigation_logs (
            frame_id TEXT PRIMARY KEY,
            timestamp TEXT,
            detected_object TEXT,
            confidence_score REAL,
            coordinate_x REAL,
            coordinate_y REAL,
            bounding_box_area REAL,
            robotics_command TEXT -- 'NAV_FORWARD', 'EVADE_OBSTACLE', 'STOP', 'ALIGN_CENTER'
        )
    ''')
    cursor.execute("SELECT COUNT(*) FROM navigation_logs")
    if cursor.fetchone()[0] == 0:
        seed_data = [
            ("FRAME-001", datetime.now(timezone.utc).isoformat(), "Obstacle_Barrier", 0.96, 120.5, 45.0, 1250.0, "EVADE_OBSTACLE"),
            ("FRAME-002", datetime.now(timezone.utc).isoformat(), "Safety_Cone", 0.92, 12.0, 15.0, 450.0, "ALIGN_CENTER"),
            ("FRAME-003", datetime.now(timezone.utc).isoformat(), "Clear_Path", 0.98, 0.0, 200.0, 0.0, "NAV_FORWARD"),
            ("FRAME-004", datetime.now(timezone.utc).isoformat(), "Hazard_Debris", 0.89, -45.0, 30.0, 820.0, "STOP")
        ]
        cursor.executemany('''
            INSERT INTO navigation_logs (frame_id, timestamp, detected_object, confidence_score, coordinate_x, coordinate_y, bounding_box_area, robotics_command)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_data)
        conn.commit()
    conn.close()

init_db()

class VisionFrameInput(BaseModel):
    detected_object: str = Field(..., example="Obstacle_Barrier")
    confidence_score: float = Field(..., ge=0.0, le=1.0, example=0.95)
    coordinate_x: float = Field(..., example=15.0, description="Horizontal pixel offset from center (-500 to +500)")
    coordinate_y: float = Field(..., example=85.0, description="Estimated distance in cm")
    bounding_box_area: float = Field(..., example=950.0)

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {"status": "healthy", "service": "vision-physical-ai-service", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/v1/vision/summary", status_code=status.HTTP_200_OK)
def get_vision_summary():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT * FROM navigation_logs", conn)
    conn.close()

    if df.empty:
        return {"total_frames": 0, "logs": []}

    total = int(len(df))
    avg_confidence = float(df["confidence_score"].mean())
    command_counts = df["robotics_command"].value_counts().to_dict()

    return {
        "status": "success",
        "total_frames_processed": total,
        "average_confidence": round(avg_confidence * 100, 2),
        "command_distribution": command_counts,
        "logs": df.to_dict(orient="records")
    }

@app.post("/api/v1/vision/process", status_code=status.HTTP_201_CREATED)
def process_vision_frame(payload: VisionFrameInput):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    frame_id = f"FRAME-{datetime.now(timezone.utc).strftime('%H%M%S%f')}"
    timestamp = datetime.now(timezone.utc).isoformat()
    
    # Autonomous edge navigation decision-making logic
    if payload.confidence_score < 0.75:
        command = "STOP"
    elif "Obstacle" in payload.detected_object or "Hazard" in payload.detected_object:
        command = "EVADE_OBSTACLE" if payload.coordinate_y < 100.0 else "NAV_FORWARD"
    elif abs(payload.coordinate_x) > 50.0:
        command = "ALIGN_CENTER"
    else:
        command = "NAV_FORWARD"

    cursor.execute('''
        INSERT INTO navigation_logs (frame_id, timestamp, detected_object, confidence_score, coordinate_x, coordinate_y, bounding_box_area, robotics_command)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (frame_id, timestamp, payload.detected_object, payload.confidence_score, payload.coordinate_x, payload.coordinate_y, payload.bounding_box_area, command))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": "Vision frame analyzed and autonomous robotics command generated.",
        "frame_id": frame_id,
        "robotics_command": command,
        "spatial_coordinates": {
            "x": payload.coordinate_x,
            "y": payload.coordinate_y
        }
    }
