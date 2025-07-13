from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from datetime import datetime

# Agent imports with fallback
FailureDetectionAgent = None
PatternDetectorAgent = None
RCAReasoningAgent = None

try:
    from RCA.failure_detection import FailureDetectionAgent
    from RCA.pattern import PatternDetectorAgent
    from RCA.rca_reasoning import RCAReasoningAgent
    print("All agents imported successfully")
except Exception as e:
    print(f"Import error: {e}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Files in current directory: {os.listdir('.')}")
    if os.path.exists('RCA'):
        print(f"Files in RCA directory: {os.listdir('RCA')}")
    print("Continuing without agents - app will still start")

# For DB insert
from memory.db import get_engine
import pandas as pd

app = FastAPI(title="RCA Unified Processor")

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploaded_data"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def health_check():
    return {"status": "FastAPI running", "timestamp": datetime.now().isoformat()}

@app.get("/health")
def detailed_health_check():
    try:
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected",
            "agents": "loaded",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/upload")
async def upload_and_store(file: UploadFile = File(...)):
    try:
        content = await file.read()
        transactions = json.loads(content)

        # Save file locally (optional, can comment out)
        filename = f"data_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(content)

        # Insert into lamx_transactions table
        engine = get_engine()
        df = pd.DataFrame(transactions)
        df.to_sql("lamx_transactions", engine, if_exists="append", index=False)

        return JSONResponse(content={"message": "uploaded!"}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/failure-detection")
async def failure_detection_endpoint():
    try:
        failure_agent = FailureDetectionAgent()
        result = failure_agent.run()
        return JSONResponse(content={
            "agent": "FailureDetectionAgent",
            "status": "success",
            "data": result or [],
            "timestamp": datetime.now().isoformat()
        }, status_code=200)
    except Exception as e:
        return JSONResponse(content={
            "agent": "FailureDetectionAgent",
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }, status_code=500)

@app.post("/api/pattern-detection")
async def pattern_detection_endpoint():
    try:
        pattern_agent = PatternDetectorAgent()
        result = pattern_agent.run()
        return JSONResponse(content={
            "agent": "PatternDetectorAgent",
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }, status_code=200)
    except Exception as e:
        return JSONResponse(content={
            "agent": "PatternDetectorAgent",
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }, status_code=500)

from fastapi import Request

@app.post("/api/rca-reasoning")
async def rca_reasoning_endpoint(request: Request):
    try:
        data = await request.json()
        transactions = data.get("transactions", [])
        rca_agent = RCAReasoningAgent()
        results = []
        for txn in transactions:
            result = rca_agent.run(txn)
            results.append({
                "txn_id": txn.get("txn_id"),
                "summary": result.get("summary"),
                "confidence": result.get("confidence"),
            })
        return JSONResponse(content={
            "agent": "RCAReasoningAgent",
            "status": "success",
            "results": results,
            "timestamp": datetime.now().isoformat()
        }, status_code=200)
    except Exception as e:
        return JSONResponse(content={
            "agent": "RCAReasoningAgent",
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }, status_code=500)


@app.get("/api/agents/status")
async def agents_status():
    return JSONResponse(content={
        "agents": {
            "FailureDetectionAgent": "available",
            "PatternDetectorAgent": "available",
            "RCAReasoningAgent": "available"
        },
        "timestamp": datetime.now().isoformat()
    }, status_code=200)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
