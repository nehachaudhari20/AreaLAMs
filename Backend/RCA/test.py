from sqlalchemy import create_engine

engine = create_engine("mysql+mysqlconnector://admin:yaswanth@llm.c0n8k0a0swtz.us-east-1.rds.amazonaws.com:3306/lamx_data")
with engine.connect() as conn:
    result = conn.execute("SELECT 1")
    print("✅ Connection successful:", result.fetchone())
