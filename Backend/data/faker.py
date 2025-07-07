# origianl file - https://colab.research.google.com/drive/1EojbqKZj_kljRKuhVa92Pbgv8FJMK-b3?usp=sharing#scrollTo=PEVf4QAjfcPR

# pip install faker pandas numpy
import hashlib
import json
import random
import pandas as pd
import numpy as np
from faker import Faker
import uuid # Import the uuid library

fake = Faker()
Faker.seed(42)

# Controlled options
gateways = ['PayZippy', 'Razorpay', 'Paytm', 'Cashfree', 'Stripe']
regions = ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Hyderabad']
services = ['Gateway_A', 'Fraud_Engine', 'UPI_Service', 'DB_Layer', 'DNS_Resolver']
error_codes = ['503_SERVICE_UNAVAILABLE', 'DB_LOCK', 'GW_TIMEOUT', 'INVALID_UPI', 'BANK_DOWN']

def generate_log():
    status = random.choices(["success", "fail"], weights=[80, 20])[0]

    if status == "fail":
        error_code = random.choices(
            error_codes, weights=[50, 20, 15, 10, 5]
        )[0]
        latency_ms = random.randint(1500, 4000)
        cpu = round(random.uniform(70, 100), 2)
        memory = round(random.uniform(80, 99), 2)
        error_count = random.randint(5, 25)
    else:
        error_code = "NONE"
        latency_ms = int(np.random.normal(300, 50))
        cpu = round(random.uniform(20, 70), 2)
        memory = round(random.uniform(30, 75), 2)
        error_count = random.randint(0, 3)

    total_requests = random.randint(50, 500)

    # Generate UUID using the standard uuid library
    txn_id_uuid = uuid.uuid4()
    trace_id_uuid = uuid.uuid4()

    return {
        "timestamp": fake.date_time_between(
            start_date=pd.to_datetime("2024-01-01"), end_date=pd.to_datetime("2025-07-03")
        ).isoformat(),
        "txn_id": txn_id_uuid.hex, # Use .hex from uuid object
        "acc_no": hashlib.sha256(fake.bban().encode()).hexdigest()[:12],
        "status": status,
        "amount": round(random.uniform(100, 10000), 2),
        "gateway": random.choice(gateways),
        "region": random.choice(regions),
        "service": random.choice(services),
        "trace_id": trace_id_uuid.hex, # Use .hex from uuid object
        "span_id": trace_id_uuid.hex[:16], # Use .hex from uuid object and slice
        "error_code": error_code,
        "latency_ms": latency_ms,
        "CPU": cpu,
        "memory_usage": memory,
        "error_count": error_count,
        "total_requests": total_requests
    }

# Generate synthetic logs
log_data = [generate_log() for _ in range(1000)]

# Save to JSON
with open("lamx_enriched_logs.json", "w") as f:
    json.dump(log_data, f, indent=4)

# Display sample
import pprint
pprint.pprint(log_data[:2])