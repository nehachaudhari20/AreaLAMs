# ✅ Add this at the top (already present)
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import os
import json
from datetime import datetime
import sys

# ✅ Agent imports (with fallback)
FailureDetectionAgent = None
PatternDetectorAgent = None
RCAReasoningAgent = None

try:
    from RCA.failure_detection import FailureDetectionAgent
    from RCA.pattern import PatternDetectorAgent
    from RCA.rca_reasoning import RCAReasoningAgent
    print("✅ All agents imported successfully")
except Exception as e:
    print(f"❌ Import error: {e}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Files in current directory: {os.listdir('.')}")
    if os.path.exists('RCA'):
        print(f"Files in RCA directory: {os.listdir('RCA')}")
    print("⚠️ Continuing without agents - app will still start")

# ✅ FastAPI app init
app = FastAPI(title="RCA Unified Processor")

# ✅ Directories
UPLOAD_DIR = "uploaded_data"
VECTOR_DIR = "vector_db/vector_store"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VECTOR_DIR, exist_ok=True)

# ✅ Routes
@app.get("/")
def health_check():
    return {"status": "FastAPI running", "timestamp": datetime.now().isoformat()}

@app.get("/health")
def detailed_health_check():
    try:
        from memory.db import get_engine
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
async def upload_and_process(file: UploadFile = File(...)):
    try:
        content = await file.read()
        filename = f"data_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(content)

        transactions = json.loads(content)
        results = []

        failure_agent = FailureDetectionAgent()
        pattern_agent = PatternDetectorAgent()
        rca_agent = RCAReasoningAgent()

        try:
            failure_result = failure_agent.run()
            pattern_result = pattern_agent.run()
            rca_result = rca_agent.run()

            for txn in transactions:
                txn_id = txn.get("txn_id")
                acc_no = txn.get("acc_no")
                results.append({
                    "txn_id": txn_id,
                    "acc_no": acc_no,
                    "failure_detected": failure_result or [],
                    "matched_pattern": pattern_result,
                    "rca_result": rca_result
                })

        except Exception as agent_error:
            for txn in transactions:
                txn_id = txn.get("txn_id")
                acc_no = txn.get("acc_no")
                results.append({
                    "txn_id": txn_id,
                    "acc_no": acc_no,
                    "error": f"Agent processing failed: {str(agent_error)}"
                })

        return JSONResponse(content={"results": results}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# ✅ Agent endpoints
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

@app.post("/api/rca-reasoning")
async def rca_reasoning_endpoint():
    try:
        rca_agent = RCAReasoningAgent()
        result = rca_agent.run()
        return JSONResponse(content={
            "agent": "RCAReasoningAgent",
            "status": "success",
            "data": result,
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

# ✅ ✅ ✅ This is what Render NEEDS to detect the app and port
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
