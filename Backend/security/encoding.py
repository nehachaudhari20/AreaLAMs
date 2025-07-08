import json
import psycopg2
from cryptography.fernet import Fernet


with open("secret.key", "wb") as key_file:
    key = Fernet.generate_key()
    key_file.write(key)

cipher = Fernet(key)


# Encrypt Function
def encrypt_field(value):
    return cipher.encrypt(value.encode()).decode()


with open("lamx_dataset.json") as f:
    data_list = json.load(f)

# database Connection
conn = psycopg2.connect(
    host="localhost", dbname="AREALIS_DATABASE", user="postgres", password="123@SITPune"
)
cur = conn.cursor()

for data in data_list:
    enc_txn_id = encrypt_field(data["txn_id"])
    enc_acc_no = encrypt_field(data["acc_no"])

    cur.execute(
        """
        INSERT INTO logs (
            enc_txn_id, enc_acc_no, status, amount,
            gateway, region, service, trace_id, span_id,
            error_code, latency_ms, cpu, memory_usage,
            error_count, total_requests, timestamp
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """,
        (
            enc_txn_id,
            enc_acc_no,
            data["status"],
            data["amount"],
            data["gateway"],
            data["region"],
            data["service"],
            data["trace_id"],
            data["span_id"],
            data["error_code"],
            data["latency_ms"],
            data["CPU"],
            data["memory_usage"],
            data["error_count"],
            data["total_requests"],
            data["timestamp"],
        ),
    )

conn.commit()
cur.close()
conn.close()

print("Encrypted data inserted successfully!")
