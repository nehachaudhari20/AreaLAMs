import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base
import pymysql

# --- ORM Base (for standalone use) ---
Base = declarative_base()

# --- SLAResult ORM Model ---
class SLAResult(Base):
    __tablename__ = "sla_results"
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, nullable=False)
    fix_outcome_id = Column(Integer, ForeignKey("fix_outcomes.id"), nullable=False)
    duration_s = Column(Float, nullable=False)
    breached = Column(Boolean, nullable=False)
    users_affected = Column(Integer, nullable=False, default=1)
    sla_threshold = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

# --- Pydantic Schemas ---
class SLARequest(BaseModel):
    alert_id: int = Field(..., description="ID of the alert (incident)")
    fix_outcome_id: int = Field(..., description="ID of the fix outcome")

class SLAResponse(BaseModel):
    sla_id: Optional[int]
    alert_id: int
    fix_outcome_id: int
    duration_s: float
    breached: bool
    users_affected: int
    sla_threshold: int
    created_at: datetime
    sla_level: str
    alert_type: str

# --- SLAAgent Logic ---
class SLAAgent:
    """Agent responsible for SLA monitoring and calculation"""
    def __init__(self):
        self.sla_thresholds = {
            "latency_spike": {"critical": 60, "warning": 300, "normal": 600},
            "gateway_error": {"critical": 120, "warning": 600, "normal": 1800},
            "timeout": {"critical": 30, "warning": 120, "normal": 300},
            "validation_error": {"critical": 60, "warning": 300, "normal": 600},
            "insufficient_funds": {"critical": 300, "warning": 900, "normal": 1800}
        }
        self.logger = logging.getLogger(__name__)

    def calculate_sla_compliance(self, alert_detected_at: datetime, fix_completed_at: datetime, alert_type: str) -> Dict[str, Any]:
        try:
            duration = (fix_completed_at - alert_detected_at).total_seconds()
            thresholds = self.sla_thresholds.get(alert_type, self.sla_thresholds["gateway_error"])
            if duration <= thresholds["critical"]:
                sla_level = "met"
                breached = False
            elif duration <= thresholds["warning"]:
                sla_level = "warning"
                breached = False
            elif duration <= thresholds["normal"]:
                sla_level = "breached"
                breached = True
            else:
                sla_level = "critical_breach"
                breached = True
            result = {
                "duration_seconds": duration,
                "sla_level": sla_level,
                "breached": breached,
                "thresholds": thresholds,
                "alert_type": alert_type
            }
            self.logger.info(f"SLA calculation: {sla_level} ({duration:.2f}s) for {alert_type}")
            return result
        except Exception as e:
            self.logger.error(f"Error calculating SLA compliance: {e}")
            return {
                "duration_seconds": 0,
                "sla_level": "unknown",
                "breached": True,
                "thresholds": {},
                "alert_type": alert_type
            }

    def calculate_users_affected(self, alert_type: str, region: str) -> int:
        try:
            base_users = {
                "latency_spike": 50,
                "gateway_error": 100,
                "timeout": 25,
                "validation_error": 75,
                "insufficient_funds": 10
            }
            region_multipliers = {
                "us-east": 1.5,
                "us-west": 1.2,
                "eu-west": 1.3,
                "ap-southeast": 1.1,
                "default": 1.0
            }
            base_count = base_users.get(alert_type, 25)
            multiplier = region_multipliers.get(region, region_multipliers["default"])
            affected_users = int(base_count * multiplier)
            self.logger.info(f"Calculated {affected_users} users affected for alert type {alert_type} in region {region}")
            return affected_users
        except Exception as e:
            self.logger.error(f"Error calculating users affected: {e}")
            return 1

# --- Example Usage Function ---
def calculate_and_store_sla(db_session, alert, fix_outcome):
    """
    Example function to calculate SLA and store the result in the database.
    db_session: SQLAlchemy session
    alert: ORM Alert object (must have detected_at, alert_type, region)
    fix_outcome: ORM FixOutcome object (must have end_ts)
    """
    agent = SLAAgent()
    sla_result = agent.calculate_sla_compliance(
        alert_detected_at=alert.detected_at,
        fix_completed_at=fix_outcome.end_ts,
        alert_type=alert.alert_type
    )
    users_affected = agent.calculate_users_affected(alert_type=alert.alert_type, region=alert.region)
    sla_db = SLAResult(
        alert_id=alert.id,
        fix_outcome_id=fix_outcome.id,
        duration_s=sla_result["duration_seconds"],
        breached=sla_result["breached"],
        users_affected=users_affected,
        sla_threshold=sla_result["thresholds"]["critical"],
        created_at=fix_outcome.end_ts
    )
    db_session.add(sla_db)
    db_session.commit()
    return sla_db

def fetch_sla_results_from_mysql():
    """
    Fetch all SLA results from the AWS MySQL database using PyMySQL.
    Returns a list of dictionaries, each representing a row from the sla_results table.
    """
    connection = None
    try:
        connection = pymysql.connect(
            host='llm.c0n8k0a0swtz.us-east-1.rds.amazonaws.com',
            user='admin',
            password='yaswanth',
            database='lamx_data',
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM sla_results")
            results = cursor.fetchall()
        return results
    except Exception as e:
        logging.error(f"Error fetching SLA results from MySQL: {e}")
        return []
    finally:
        if connection:
            connection.close()

def list_mysql_tables():
    """
    List all tables in the AWS MySQL database using PyMySQL.
    Returns a list of table names.
    """
    connection = None
    try:
        connection = pymysql.connect(
            host='llm.c0n8k0a0swtz.us-east-1.rds.amazonaws.com',
            user='admin',
            password='yaswanth',
            database='lamx_data',
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            results = cursor.fetchall()
        # The key for the table name is dynamic, so extract all values
        table_names = [list(row.values())[0] for row in results]
        return table_names
    except Exception as e:
        logging.error(f"Error listing tables from MySQL: {e}")
        return []
    finally:
        if connection:
            connection.close()

def get_sla_compliance_from_db(alert_detected_at=None, fix_completed_at=None, alert_type=None):
    """
    Calculate SLA compliance using provided parameters, or fetch them from the database if missing.
    If any parameter is missing, fetch the latest record from 'anomaly_logs' or 'lamx_transactions' and extract values.
    Returns a dictionary in the format:
    {
        "duration_seconds": ...,
        "sla_level": ...,
        "breached": ...,
        "thresholds": ...,
        "alert_type": ...
    }
    """
    import pymysql
    import logging
    from datetime import datetime

    # If all parameters are provided, use them directly
    if alert_detected_at and fix_completed_at and alert_type:
        agent = SLAAgent()
        return agent.calculate_sla_compliance(alert_detected_at, fix_completed_at, alert_type)

    # Otherwise, fetch from the database
    connection = None
    try:
        connection = pymysql.connect(
            host='llm.c0n8k0a0swtz.us-east-1.rds.amazonaws.com',
            user='admin',
            password='yaswanth',
            database='lamx_data',
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            # Try anomaly_logs first
            cursor.execute("SHOW COLUMNS FROM anomaly_logs")
            columns = [col['Field'] for col in cursor.fetchall()]
            # Try to find suitable columns for detected_at, end_ts, alert_type
            # We'll assume 'created_at' for detected_at, 'resolved_at' or 'fixed_at' for fix_completed_at, and 'alert_type' or 'anomaly_type' for alert_type
            detected_col = None
            fix_col = None
            type_col = None
            for c in columns:
                if c in ['detected_at', 'created_at', 'timestamp']:
                    detected_col = c
                if c in ['resolved_at', 'fixed_at', 'end_ts', 'fixed_time']:
                    fix_col = c
                if c in ['alert_type', 'anomaly_type', 'type']:
                    type_col = c
            # If any are missing, try lamx_transactions
            if not (detected_col and fix_col and type_col):
                cursor.execute("SHOW COLUMNS FROM lamx_transactions")
                columns = [col['Field'] for col in cursor.fetchall()]
                for c in columns:
                    if c in ['detected_at', 'created_at', 'timestamp'] and not detected_col:
                        detected_col = c
                    if c in ['resolved_at', 'fixed_at', 'end_ts', 'fixed_time'] and not fix_col:
                        fix_col = c
                    if c in ['alert_type', 'anomaly_type', 'type'] and not type_col:
                        type_col = c
                table = 'lamx_transactions'
            else:
                table = 'anomaly_logs'
            if not (detected_col and fix_col and type_col):
                logging.error("Could not find suitable columns for SLA calculation in the database.")
                return {}
            # Fetch the latest record with all three fields not null
            query = f"SELECT * FROM {table} WHERE {detected_col} IS NOT NULL AND {fix_col} IS NOT NULL AND {type_col} IS NOT NULL ORDER BY {detected_col} DESC LIMIT 1"
            cursor.execute(query)
            row = cursor.fetchone()
            if not row:
                logging.error("No suitable record found in the database for SLA calculation.")
                return {}
            # Parse datetimes
            detected_at_val = row[detected_col]
            fix_completed_val = row[fix_col]
            alert_type_val = row[type_col]
            # Convert to datetime if needed
            if isinstance(detected_at_val, str):
                detected_at_val = datetime.fromisoformat(detected_at_val.replace('Z', '+00:00')) if 'T' in detected_at_val else datetime.strptime(detected_at_val, '%Y-%m-%d %H:%M:%S')
            if isinstance(fix_completed_val, str):
                fix_completed_val = datetime.fromisoformat(fix_completed_val.replace('Z', '+00:00')) if 'T' in fix_completed_val else datetime.strptime(fix_completed_val, '%Y-%m-%d %H:%M:%S')
            agent = SLAAgent()
            return agent.calculate_sla_compliance(detected_at_val, fix_completed_val, alert_type_val)
    except Exception as e:
        logging.error(f"Error in get_sla_compliance_from_db: {e}")
        return {}
    finally:
        if connection:
            connection.close()

def create_sla_table_if_not_exists():
    """
    Create the sla_table in the AWS MySQL database if it does not exist.
    """
    connection = None
    try:
        connection = pymysql.connect(
            host='llm.c0n8k0a0swtz.us-east-1.rds.amazonaws.com',
            user='admin',
            password='yaswanth',
            database='lamx_data',
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sla_table (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    acc_no VARCHAR(32),
                    txn_id VARCHAR(64),
                    root_cause TEXT,
                    fix_suggestion TEXT,
                    actions_taken TEXT,
                    confidence FLOAT,
                    explanation TEXT,
                    sla_breached BOOLEAN,
                    estimated_loss FLOAT,
                    users_affected INT,
                    severity VARCHAR(32),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
        connection.commit()
    except Exception as e:
        logging.error(f"Error creating sla_table: {e}")
    finally:
        if connection:
            connection.close()


# (No confidence score logic present in this file. All confidence-related code has been removed.)


def save_sla_analysis_to_db():
    """
    Fetch the latest anomaly from anomaly_logs, generate the required output, calculate confidence, and insert into sla_table.
    """
    connection = None
    try:
        create_sla_table_if_not_exists()
        connection = pymysql.connect(
            host='llm.c0n8k0a0swtz.us-east-1.rds.amazonaws.com',
            user='admin',
            password='yaswanth',
            database='lamx_data',
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM anomaly_logs ORDER BY timestamp DESC LIMIT 1")
            row = cursor.fetchone()
            if not row:
                logging.error("No anomaly_logs record found.")
                return None
            # Map fields
            acc_no = "UDAX43321819"  # Placeholder, not in anomaly_logs
            txn_id = row.get("txn_id", "TXN12345")
            root_cause = row.get("rca_summary", "gateway_timeout")
            fix_suggestion = "reroute_gateway"  # Placeholder
            actions_taken = '["rerouted_gateway"]'  # Placeholder, store as JSON string
            explanation = row.get("rca_summary", "Similar to previous Razorpay failures in Delhi")
            sla_breached = True  # Placeholder, could be calculated
            estimated_loss = 348  # Placeholder
            users_affected = 1  # Placeholder
            severity = "critical"  # Placeholder, could be inferred from z_score or rca_summary
            # Confidence factors (use placeholder values or infer if possible)
            success_rate = 0.9
            similarity = 0.95
            severity_factor = 0.8
            sla_urgency = 0.7
            confidence = 0 # Placeholder, no confidence score calculation
            # Insert into sla_table
            insert_query = '''
                INSERT INTO sla_table (
                    acc_no, txn_id, root_cause, fix_suggestion, actions_taken, confidence, explanation, sla_breached, estimated_loss, users_affected, severity
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            '''
            cursor.execute(insert_query, (
                acc_no, txn_id, root_cause, fix_suggestion, actions_taken, confidence, explanation, sla_breached, estimated_loss, users_affected, severity
            ))
        connection.commit()
        logging.info("SLA analysis saved to sla_table.")
        return {
            "acc_no": acc_no,
            "txn_id": txn_id,
            "root_cause": root_cause,
            "fix_suggestion": fix_suggestion,
            "actions_taken": ["rerouted_gateway"],
            "confidence": confidence,
            "explanation": explanation,
            "sla_breached": sla_breached,
            "estimated_loss": estimated_loss,
            "users_affected": users_affected,
            "severity": severity
        }
    except Exception as e:
        logging.error(f"Error in save_sla_analysis_to_db: {e}")
        return None
    finally:
        if connection:
            connection.close()

def create_report_table_if_not_exists():
    """
    Create the report_table in the AWS MySQL database if it does not exist.
    """
    connection = None
    try:
        connection = pymysql.connect(
            host='llm.c0n8k0a0swtz.us-east-1.rds.amazonaws.com',
            user='admin',
            password='yaswanth',
            database='lamx_data',
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS report_table (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    acc_no VARCHAR(32),
                    txn_id VARCHAR(64),
                    rca_summary TEXT,
                    actions_taken TEXT,
                    confidence FLOAT,
                    sla_breached BOOLEAN,
                    users_affected INT,
                    severity VARCHAR(32),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
        connection.commit()
    except Exception as e:
        logging.error(f"Error creating report_table: {e}")
    finally:
        if connection:
            connection.close()


def process_sla_table_and_generate_report():
    """
    Fetch all rows from sla_table, compute SLA fields, and insert into report_table.
    """
    connection = None
    try:
        create_report_table_if_not_exists()
        connection = pymysql.connect(
            host='llm.c0n8k0a0swtz.us-east-1.rds.amazonaws.com',
            user='admin',
            password='yaswanth',
            database='lamx_data',
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            cursor.execute('SELECT * FROM sla_table')
            rows = cursor.fetchall()
            for row in rows:
                acc_no = row.get('acc_no')
                txn_id = row.get('txn_id')
                rca_summary = row.get('rca_summary') or row.get('root_cause')
                actions_taken = row.get('actions_taken')
                confidence = row.get('confidence', 0)
                created_at = row.get('created_at')
                # For SLA logic, try to infer alert_type from rca_summary or default
                alert_type = 'gateway_error'
                if rca_summary:
                    if 'latency' in rca_summary:
                        alert_type = 'latency_spike'
                    elif 'timeout' in rca_summary:
                        alert_type = 'timeout'
                    elif 'validation' in rca_summary:
                        alert_type = 'validation_error'
                    elif 'insufficient' in rca_summary:
                        alert_type = 'insufficient_funds'
                # Use created_at as fix_completed_at, and estimate detected_at as 5 minutes before (if not available)
                fix_completed_at = created_at
                if isinstance(fix_completed_at, str):
                    try:
                        fix_completed_at = datetime.fromisoformat(fix_completed_at.replace('Z', '+00:00')) if 'T' in fix_completed_at else datetime.strptime(fix_completed_at, '%Y-%m-%d %H:%M:%S')
                    except Exception:
                        fix_completed_at = datetime.utcnow()
                alert_detected_at = fix_completed_at
                try:
                    alert_detected_at = fix_completed_at - timedelta(minutes=5)
                except Exception:
                    alert_detected_at = fix_completed_at
                agent = SLAAgent()
                sla_result = agent.calculate_sla_compliance(
                    alert_detected_at=alert_detected_at,
                    fix_completed_at=fix_completed_at,
                    alert_type=alert_type
                )
                users_affected = agent.calculate_users_affected(alert_type=alert_type, region='default')
                sla_breached = sla_result['breached']
                severity = sla_result['sla_level']
                # Insert into report_table
                insert_query = '''
                    INSERT INTO report_table (
                        acc_no, txn_id, rca_summary, actions_taken, confidence, sla_breached, users_affected, severity, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                '''
                cursor.execute(insert_query, (
                    acc_no, txn_id, rca_summary, actions_taken, confidence, sla_breached, users_affected, severity, fix_completed_at
                ))
        connection.commit()
        logging.info("Processed sla_table and generated report_table.")
    except Exception as e:
        logging.error(f"Error processing sla_table for report_table: {e}")
    finally:
        if connection:
            connection.close()

def print_report_table_contents():
    """
    Print all rows from report_table for verification.
    """
    connection = None
    try:
        connection = pymysql.connect(
            host='llm.c0n8k0a0swtz.us-east-1.rds.amazonaws.com',
            user='admin',
            password='yaswanth',
            database='lamx_data',
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            cursor.execute('SELECT * FROM report_table')
            rows = cursor.fetchall()
            for row in rows:
                print(row)
    except Exception as e:
        logging.error(f"Error printing report_table: {e}")
    finally:
        if connection:
            connection.close()

if __name__ == "__main__":
    process_sla_table_and_generate_report()
    print("\nContents of report_table:")
    print_report_table_contents() 