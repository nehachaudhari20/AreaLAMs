#!/bin/bash

# Set Python version
export PYTHON_VERSION=3.10.13

# Create necessary directories
mkdir -p uploaded_data
mkdir -p vector_db/vector_store

# Install dependencies
pip install -r requirements.txt

# Start the application
uvicorn main:app --host 0.0.0.0 --port $PORT 