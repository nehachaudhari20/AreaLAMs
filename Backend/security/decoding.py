import psycopg2
from cryptography.fernet import Fernet

with open("secret.key", "rb") as key_file:
    key = key_file.read()

cipher = Fernet(key)


# Decrypt Function
def decrypt_field(value):
    return cipher.decrypt(value.encode()).decode()


conn = psycopg2.connect(
    host="localhost", dbname="AREALIS_DATABASE", user="postgres", password="123@SITPune"
)
cur = conn.cursor()

cur.execute("SELECT * FROM logs")
rows = cur.fetchall()
decrypted_data = []
for row in rows:
    dec_txn_id = decrypt_field(row[0])
    dec_acc_no = decrypt_field(row[1])
    decrypted_data.append(
        {
            "txn_id": dec_txn_id,
            "acc_no": dec_acc_no,
            "status": row[2],
            "amount": row[3],
            "gateway": row[4],
            "region": row[5],
            "service": row[6],
            "trace_id": row[7],
            "span_id": row[8],
            "error_code": row[9],
            "latency_ms": row[10],
            "cpu": row[11],
            "memory_usage": row[12],
            "error_count": row[13],
            "total_requests": row[14],
            "timestamp": row[15],
        }
    )

cur.close()
conn.close()
print("Decryption successfully!")
