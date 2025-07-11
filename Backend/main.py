from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import os
import json
from datetime import datetime

from RCA.failure_detection import FailureDetectionAgent
from RCA.pattern import PatternDetectorAgent
from RCA.rca_reasoning import RCAReasoningAgent

app = FastAPI(title="RCA Unified Processor")

UPLOAD_DIR = "uploaded_data"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def health_check():
    return {"status": "FastAPI running"}

@app.post("/upload")
async def upload_and_process(file: UploadFile = File(...)):
    try:
        # Save uploaded file
        content = await file.read()
        filename = f"data_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(content)

        transactions = json.loads(content)
        results = []

        for txn in transactions:
            txn_id = txn.get("txn_id")
            acc_no = txn.get("acc_no")

            # Initialize and run agents
            failure_agent = FailureDetectionAgent(txn)
            failure_result = failure_agent.run()

            pattern_agent = PatternDetectorAgent(txn)
            pattern_result = pattern_agent.run()

            rca_agent = RCAReasoningAgent()
            rca_result = rca_agent.run_single(txn)

            results.append(
                {
                    "txn_id": txn_id,
                    "acc_no": acc_no,
                    "failure_detected": failure_result,
                    "matched_pattern": pattern_result,
                    "rca_result": rca_result,
                }
            )

        return JSONResponse(content={"results": results}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
