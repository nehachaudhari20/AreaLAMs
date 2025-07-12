
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import os
import json
from datetime import datetime
import sys

# Add error handling for imports
try:
    from RCA.failure_detection import FailureDetectionAgent
    from RCA.pattern import PatternDetectorAgent
    from RCA.rca_reasoning import RCAReasoningAgent
    print("✅ All agents imported successfully")
except Exception as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

app = FastAPI(title="RCA Unified Processor")
 
UPLOAD_DIR = "uploaded_data"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Create necessary directories for agents
VECTOR_DIR = "vector_db/vector_store"
os.makedirs(VECTOR_DIR, exist_ok=True)
 
@app.get("/")
def health_check():
    return {"status": "FastAPI running", "timestamp": datetime.now().isoformat()}

@app.get("/health")
def detailed_health_check():
    try:
        # Test database connection
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
        # Save uploaded file
        content = await file.read()
        filename = f"data_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(content)

        # Parse transactions
        transactions = json.loads(content)
        results = []

        # Initialize agents once (more efficient)
        failure_agent = FailureDetectionAgent()
        pattern_agent = PatternDetectorAgent()
        rca_agent = RCAReasoningAgent()

        try:
            # Run agents to get analysis results
            failure_result = failure_agent.run()
            pattern_result = pattern_agent.run()
            rca_result = rca_agent.run()

            # Process each transaction with the analysis results
            for txn in transactions:
                txn_id = txn.get("txn_id")
                acc_no = txn.get("acc_no")

                # Create result entry with proper data types
                result_entry = {
                    "txn_id": txn_id,
                    "acc_no": acc_no,
                    "failure_detected": failure_result if failure_result else [],
                    "matched_pattern": pattern_result if pattern_result else None,
                    "rca_result": rca_result if rca_result else None,
                }

                results.append(result_entry)

        except Exception as agent_error:
            print(f"Agent processing failed: {str(agent_error)}")
            # Return error for all transactions
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
        print("Upload processing failed:", str(e))
        return JSONResponse(content={"error": str(e)}, status_code=500)

# Individual Agent Endpoints
@app.post("/api/failure-detection")
async def failure_detection_endpoint():
    """Endpoint for Failure Detection Agent"""
    try:
        failure_agent = FailureDetectionAgent()
        result = failure_agent.run()
        return JSONResponse(content={
            "agent": "FailureDetectionAgent",
            "status": "success",
            "data": result if result else [],
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
    """Endpoint for Pattern Detection Agent"""
    try:
        pattern_agent = PatternDetectorAgent()
        result = pattern_agent.run()
        return JSONResponse(content={
            "agent": "PatternDetectorAgent",
            "status": "success",
            "data": result if result else None,
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
    """Endpoint for RCA Reasoning Agent"""
    try:
        rca_agent = RCAReasoningAgent()
        result = rca_agent.run()
        return JSONResponse(content={
            "agent": "RCAReasoningAgent",
            "status": "success",
            "data": result if result else None,
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
    """Get status of all agents"""
    try:
        return JSONResponse(content={
            "agents": {
                "FailureDetectionAgent": "available",
                "PatternDetectorAgent": "available", 
                "RCAReasoningAgent": "available"
            },
            "timestamp": datetime.now().isoformat()
        }, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

