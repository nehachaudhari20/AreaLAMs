# RCA API Service

A FastAPI service for Root Cause Analysis (RCA) with three specialized AI agents.

## Deployed API Endpoints

### Base URL
```
https://your-app-name.onrender.com
```

### Available Endpoints

#### 1. Health Check
```
GET /
```
**Response:**
```json
{
  "status": "FastAPI running"
}
```

#### 2. Upload and Process (Combined Analysis)
```
POST /upload
```
**Input:** JSON file with transaction data
**Response:** Combined results from all agents

#### 3. Individual Agent Endpoints

##### Failure Detection Agent
```
POST /api/failure-detection
```
**Response:**
```json
{
  "agent": "FailureDetectionAgent",
  "status": "success",
  "data": [...],
  "timestamp": "2025-07-12T10:30:00"
}
```

##### Pattern Detection Agent
```
POST /api/pattern-detection
```
**Response:**
```json
{
  "agent": "PatternDetectorAgent", 
  "status": "success",
  "data": [...],
  "timestamp": "2025-07-12T10:30:00"
}
```

##### RCA Reasoning Agent
```
POST /api/rca-reasoning
```
**Response:**
```json
{
  "agent": "RCAReasoningAgent",
  "status": "success", 
  "data": [...],
  "timestamp": "2025-07-12T10:30:00"
}
```

#### 4. Agent Status Check
```
GET /api/agents/status
```
**Response:**
```json
{
  "agents": {
    "FailureDetectionAgent": "available",
    "PatternDetectorAgent": "available",
    "RCAReasoningAgent": "available"
  },
  "timestamp": "2025-07-12T10:30:00"
}
```

## Environment Variables Required

- `DATABASE_URL`: MySQL connection string
- `GROQ_API_KEY`: Groq API key for LLM
- `MODEL_ID`: LLM model ID (default: llama3-8b-8192)

## Testing the API

### Using curl
```bash
# Health check
curl https://your-app-name.onrender.com/

# Test failure detection
curl -X POST https://your-app-name.onrender.com/api/failure-detection

# Test pattern detection  
curl -X POST https://your-app-name.onrender.com/api/pattern-detection

# Test RCA reasoning
curl -X POST https://your-app-name.onrender.com/api/rca-reasoning
```

### Using Swagger UI
Visit: `https://your-app-name.onrender.com/docs` 