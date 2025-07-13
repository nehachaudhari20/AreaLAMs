# Updated SLA code with confidence score integrated from RCAReasoningAgent (rca_reasoning.py)

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

# --- Updated SLA Analysis Storage ---
def save_sla_analysis_to_db_with_confidence(confidence_score: float):
    """
    Fetch the latest anomaly from anomaly_logs, generate SLA analysis, and insert into sla_table using the provided confidence score.
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
            cursor.execute("SELECT * FROM anomaly_logs ORDER BY timestamp DESC LIMIT 1")
            row = cursor.fetchone()
            if not row:
                logging.error("No anomaly_logs record found.")
                return None
            acc_no = "UDAX43321819"
            txn_id = row.get("txn_id", "TXN12345")
            root_cause = row.get("rca_summary", "gateway_timeout")
            fix_suggestion = "reroute_gateway"
            actions_taken = '["rerouted_gateway"]'
            explanation = row.get("rca_summary", "RCA not available")
            sla_breached = True
            estimated_loss = 348
            users_affected = 1
            severity = "critical"
            insert_query = '''
                INSERT INTO sla_table (
                    acc_no, txn_id, root_cause, fix_suggestion, actions_taken, confidence, explanation,
                    sla_breached, estimated_loss, users_affected, severity
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            '''
            cursor.execute(insert_query, (
                acc_no, txn_id, root_cause, fix_suggestion, actions_taken, confidence_score, explanation,
                sla_breached, estimated_loss, users_affected, severity
            ))
        connection.commit()
        logging.info("SLA analysis with confidence saved to sla_table.")
        return {
            "acc_no": acc_no,
            "txn_id": txn_id,
            "root_cause": root_cause,
            "fix_suggestion": fix_suggestion,
            "actions_taken": ["rerouted_gateway"],
            "confidence": confidence_score,
            "explanation": explanation,
            "sla_breached": sla_breached,
            "estimated_loss": estimated_loss,
            "users_affected": users_affected,
            "severity": severity
        }
    except Exception as e:
        logging.error(f"Error saving SLA with confidence: {e}")
        return None
    finally:
        if connection:
            connection.close()
