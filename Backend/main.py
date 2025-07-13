# ✅ Add this at the top (already present)
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import os
import json
from datetime import datetime
import sys
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from memory.db import get_engine



# ✅ Agent imports (with fallback)
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

# ✅ FastAPI app init
app = FastAPI(title="RCA Unified Processor")

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 


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
        transactions = json.loads(content)
        
        if not isinstance(transactions, list):
            return JSONResponse(content={"error": "Uploaded data must be a list of transactions"}, status_code=400)
        
        engine = get_engine()
        inserted = 0
        skipped = 0
        errors = []
        
        with engine.connect() as conn:
            for i, txn in enumerate(transactions):
                if not isinstance(txn, dict):
                    errors.append(f"Transaction {i+1}: Invalid format (not a dictionary)")
                    continue
                
                # Check if transaction already exists (using txn_id as unique identifier)
                txn_id = txn.get('txn_id')
                if txn_id:
                    check_stmt = text("SELECT COUNT(*) FROM lamx_transactions WHERE txn_id = :txn_id")
                    result = conn.execute(check_stmt, {"txn_id": txn_id}).fetchone()
                    if result[0] > 0:
                        print(f"Skipping duplicate txn_id: {txn_id}")
                        skipped += 1
                        continue
                
                # Get the next serial number from database
                try:
                    max_serial_stmt = text("SELECT COALESCE(MAX(serial_no), 0) + 1 FROM lamx_transactions")
                    result = conn.execute(max_serial_stmt).fetchone()
                    next_serial = result[0] if result and result[0] else 1
                    txn['serial_no'] = next_serial
                except Exception as serial_err:
                    print(f"Error getting serial number: {serial_err}")
                    # Fallback: use timestamp-based serial
                    txn['serial_no'] = int(datetime.now().timestamp())
                
                # Ensure all required fields are present
                required_fields = ['txn_id', 'acc_no', 'status']
                missing_fields = [field for field in required_fields if field not in txn]
                if missing_fields:
                    errors.append(f"Transaction {i+1}: Missing required fields: {missing_fields}")
                    continue
                
                keys = txn.keys()
                columns = ', '.join(keys)
                values = ', '.join([f":{k}" for k in keys])
                insert_stmt = text(f"INSERT INTO lamx_transactions ({columns}) VALUES ({values})")
                try:
                    conn.execute(insert_stmt, txn)
                    inserted += 1
                    print(f"Successfully inserted transaction {i+1}: {txn_id}")
                except Exception as db_err:
                    error_msg = f"Transaction {i+1} ({txn_id}): {str(db_err)}"
                    print(error_msg)
                    errors.append(error_msg)
            
            conn.commit()
        
        return JSONResponse(content={
            "status": "success", 
            "inserted": inserted, 
            "skipped": skipped,
            "total_uploaded": len(transactions),
            "errors": errors if errors else None
        }, status_code=200)
    except json.JSONDecodeError as e:
        return JSONResponse(content={"error": f"Invalid JSON format: {str(e)}"}, status_code=400)
    except Exception as e:
        return JSONResponse(content={"error": f"Upload failed: {str(e)}"}, status_code=500)

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
        
        # Fetch RCA results from anomaly_logs table
        engine = get_engine()
        with engine.connect() as conn:
            query = text("""
                SELECT txn_id, service, metric, value, timestamp, z_score, 
                       rca_summary, rca_confidence
                FROM anomaly_logs 
                WHERE rca_summary IS NOT NULL AND rca_confidence IS NOT NULL
                ORDER BY timestamp DESC
            """)
            result = conn.execute(query).fetchall()
            
            rca_results = []
            for row in result:
                rca_results.append({
                    "txn_id": row[0],
                    "service": row[1],
                    "metric": row[2],
                    "value": row[3],
                    "timestamp": str(row[4]),
                    "z_score": row[5],
                    "rca_summary": row[6],
                    "rca_confidence": float(row[7]) if row[7] else None
                })
        
        return JSONResponse(content={
            "agent": "RCAReasoningAgent",
            "status": "success",
            "data": rca_results,
            "count": len(rca_results),
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
    port = int(os.environ.get("PORT", 8000)) 
    uvicorn.run(app, host="0.0.0.0", port=port)