import requests
import json

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Health Check: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return False

def test_agent_status():
    """Test the agent status endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/agents/status")
        print(f"✅ Agent Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Agent Status Failed: {e}")
        return False

def test_failure_detection():
    """Test the failure detection agent"""
    try:
        response = requests.post(f"{BASE_URL}/api/failure-detection")
        print(f"✅ Failure Detection: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Failure Detection Failed: {e}")
        return False

def test_pattern_detection():
    """Test the pattern detection agent"""
    try:
        response = requests.post(f"{BASE_URL}/api/pattern-detection")
        print(f"✅ Pattern Detection: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Pattern Detection Failed: {e}")
        return False

def test_rca_reasoning():
    """Test the RCA reasoning agent"""
    try:
        response = requests.post(f"{BASE_URL}/api/rca-reasoning")
        print(f"✅ RCA Reasoning: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ RCA Reasoning Failed: {e}")
        return False

def test_upload_endpoint():
    """Test the upload endpoint with sample data"""
    try:
        # Sample transaction data
        sample_data = [
            {
                "txn_id": "test_001",
                "acc_no": "ACC001",
                "service": "Gateway_A",
                "metric": "latency_ms",
                "value": 3500
            }
        ]
        
        # Create a file-like object
        files = {
            'file': ('test_data.json', json.dumps(sample_data), 'application/json')
        }
        
        response = requests.post(f"{BASE_URL}/upload", files=files)
        print(f"✅ Upload Endpoint: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Upload Endpoint Failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing RCA API Endpoints...\n")
    
    tests = [
        ("Health Check", test_health_check),
        ("Agent Status", test_agent_status),
        ("Failure Detection", test_failure_detection),
        ("Pattern Detection", test_pattern_detection),
        ("RCA Reasoning", test_rca_reasoning),
        ("Upload Endpoint", test_upload_endpoint)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n--- Testing {test_name} ---")
        result = test_func()
        results.append((test_name, result))
    
    print(f"\n📊 Test Results Summary:")
    print("=" * 40)
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your API is ready for deployment!")
    else:
        print("⚠️ Some tests failed. Check the errors above.") 