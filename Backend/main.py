from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from datetime import datetime
import sys
import pandas as pd
from sqlalchemy import text
from memory.db import get_engine

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

app = FastAPI(title="RCA Unified Processor")

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

        if not isinstance(transactions, list):
            return JSONResponse(content={"error": "Uploaded data must be a list of transactions"}, status_code=400)

        engine = get_engine()
        inserted, skipped = 0, 0
        errors = []

        with engine.connect() as conn:
            for i, txn in enumerate(transactions):
                if not isinstance(txn, dict):
                    errors.append(f"Transaction {i+1}: Invalid format (not a dictionary)")
                    continue

                txn_id = txn.get('txn_id')
                if txn_id:
                    result = conn.execute(
                        text("SELECT COUNT(*) FROM lamx_transactions WHERE txn_id = :txn_id"),
                        {"txn_id": txn_id}
                    ).fetchone()
                    if result[0] > 0:
                        skipped += 1
                        continue

                try:
                    result = conn.execute(text("SELECT COALESCE(MAX(serial_no), 0) + 1 FROM lamx_transactions")).fetchone()
                    txn['serial_no'] = result[0] if result and result[0] else 1
                except:
                    txn['serial_no'] = int(datetime.now().timestamp())

                required_fields = ['txn_id', 'acc_no', 'status']
                missing = [field for field in required_fields if field not in txn]
                if missing:
                    errors.append(f"Transaction {i+1}: Missing required fields: {missing}")
                    continue

                keys = txn.keys()
                columns = ', '.join(keys)
                values = ', '.join([f":{k}" for k in keys])
                insert_stmt = text(f"INSERT INTO lamx_transactions ({columns}) VALUES ({values})")

                try:
                    conn.execute(insert_stmt, txn)
                    inserted += 1
                except Exception as db_err:
                    errors.append(f"Transaction {i+1} ({txn_id}): {str(db_err)}")

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

@app.post("/api/failure-detection")
async def failure_detection_endpoint():
    try:
        engine = get_engine()
        
        # Step 1: Create new_uploaded_data table if it doesn't exist
        with engine.connect() as conn:
            create_table_query = text("""
                CREATE TABLE IF NOT EXISTS new_uploaded_data (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    txn_id VARCHAR(255),
                    acc_no VARCHAR(255),
                    status VARCHAR(50),
                    amount DECIMAL(10,2),
                    gateway VARCHAR(100),
                    region VARCHAR(100),
                    service VARCHAR(100),
                    trace_id VARCHAR(255),
                    span_id VARCHAR(255),
                    error_code VARCHAR(100),
                    latency_ms INT,
                    cpu DECIMAL(5,2),
                    memory_usage DECIMAL(5,2),
                    error_count INT,
                    total_requests INT,
                    timestamp DATETIME,
                    serial_no INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.execute(create_table_query)
            conn.commit()
        
        # Step 2: Move new data from lamx_transactions to new_uploaded_data
        with engine.connect() as conn:
            # Get the latest processed timestamp from anomaly_logs
            latest_processed_query = text("""
                SELECT MAX(timestamp) as latest_processed 
                FROM anomaly_logs 
                WHERE timestamp IS NOT NULL
            """)
            result = conn.execute(latest_processed_query).fetchone()
            latest_processed = result[0] if result and result[0] else None
            
            # Get the actual columns from lamx_transactions table
            columns_query = text("SHOW COLUMNS FROM lamx_transactions")
            columns_result = conn.execute(columns_query).fetchall()
            lamx_columns = [col[0] for col in columns_result]
            
            # Define the columns we want to insert into new_uploaded_data
            target_columns = ['txn_id', 'acc_no', 'status', 'amount', 'gateway', 'region', 'service', 
                            'trace_id', 'span_id', 'error_code', 'latency_ms', 'cpu', 'memory_usage', 
                            'error_count', 'total_requests', 'timestamp', 'serial_no']
            
            # Filter columns that exist in lamx_transactions
            available_columns = [col for col in target_columns if col in lamx_columns]
            columns_str = ', '.join(available_columns)
            select_columns_str = ', '.join(available_columns)
            
            # Insert new data into new_uploaded_data
            if latest_processed:
                insert_new_data_query = text(f"""
                    INSERT INTO new_uploaded_data 
                    ({columns_str})
                    SELECT {select_columns_str}
                    FROM lamx_transactions 
                    WHERE timestamp > :latest_processed AND status = 'fail' AND latency_ms IS NOT NULL
                """)
                conn.execute(insert_new_data_query, {"latest_processed": latest_processed})
            else:
                # If no previous data, process all failed transactions
                insert_all_data_query = text(f"""
                    INSERT INTO new_uploaded_data 
                    ({columns_str})
                    SELECT {select_columns_str}
                    FROM lamx_transactions 
                    WHERE status = 'fail' AND latency_ms IS NOT NULL
                """)
                conn.execute(insert_all_data_query)
            
            conn.commit()
        
        # Step 3: Run failure detection on new data only
        failure_agent = FailureDetectionAgent()
        result = failure_agent.run()
        
        # Step 4: Clear the new_uploaded_data table after processing
        with engine.connect() as conn:
            clear_table_query = text("DELETE FROM new_uploaded_data")
            conn.execute(clear_table_query)
            conn.commit()
        
        return JSONResponse(content={
            "agent": "FailureDetectionAgent",
            "status": "success",
            "data": result or [],
            "processed_new_data": True,
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
async def rca_reasoning_endpoint(request: Request):
    try:
        data = await request.json()
        transactions = data.get("transactions", [])
        rca_agent = RCAReasoningAgent()

        # First run: default run
        rca_agent.run()

        # Fetch from DB
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT txn_id, service, metric, value, timestamp, z_score, 
                       rca_summary, rca_confidence
                FROM anomaly_logs 
                WHERE rca_summary IS NOT NULL AND rca_confidence IS NOT NULL
                ORDER BY timestamp DESC
            """)).fetchall()

        rca_results = [{
            "txn_id": row[0],
            "service": row[1],
            "metric": row[2],
            "value": row[3],
            "timestamp": str(row[4]),
            "z_score": row[5],
            "rca_summary": row[6],
            "rca_confidence": float(row[7]) if row[7] else None
        } for row in result]

        # Second pass: run per transaction
        txn_results = []
        for txn in transactions:
            output = rca_agent.run(txn)
            txn_results.append({
                "txn_id": txn.get("txn_id"),
                "summary": output.get("summary"),
                "confidence": output.get("confidence"),
            })

        return JSONResponse(content={
            "agent": "RCAReasoningAgent",
            "status": "success",
            "data_from_db": rca_results,
            "results_from_input": txn_results,
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
