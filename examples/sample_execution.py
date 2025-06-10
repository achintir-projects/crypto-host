#!/usr/bin/env python3
"""
SAMPLE USDT PROCESSOR EXECUTION
==============================
Example of how to process pre-released SWIFT files
"""

import json
import requests
import time
from pathlib import Path

class USDTProcessor:
    def __init__(self, api_base_url, api_key):
        self.api_base_url = api_base_url
        self.api_key = api_key
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    def process_pre_released_file(self, file_path):
        """Process a pre-released SWIFT file"""
        
        print(f"Processing file: {file_path}")
        
        # Load the pre-released file
        with open(file_path, 'r') as f:
            swift_data = json.load(f)
        
        # Validate required fields
        if not self.validate_swift_file(swift_data):
            print("ERROR: Invalid SWIFT file format")
            return False
        
        # Submit for processing
        response = requests.post(
            f"{self.api_base_url}/api/v1/usdt/process",
            headers=self.headers,
            json=swift_data
        )
        
        if response.status_code == 200:
            result = response.json()
            process_id = result['process_id']
            
            print(f"SUCCESS: Processing started - ID: {process_id}")
            
            # Monitor progress
            return self.monitor_processing(process_id)
        else:
            print(f"ERROR: {response.status_code} - {response.text}")
            return False
    
    def validate_swift_file(self, data):
        """Validate SWIFT file structure"""
        
        required_sections = [
            'swift_release_confirmation',
            'transaction_instructions', 
            'authentication'
        ]
        
        for section in required_sections:
            if section not in data:
                print(f"Missing required section: {section}")
                return False
        
        # Check SWIFT release confirmation
        swift_conf = data['swift_release_confirmation']
        required_swift_fields = [
            'swift_release_reference',
            'releasing_bank_name',
            'release_date_time',
            'authorized_signatory',
            'compliance_status'
        ]
        
        for field in required_swift_fields:
            if field not in swift_conf:
                print(f"Missing SWIFT field: {field}")
                return False
        
        if swift_conf['compliance_status'] != 'APPROVED':
            print("ERROR: SWIFT release not approved")
            return False
        
        print("SUCCESS: File validation passed")
        return True
    
    def monitor_processing(self, process_id):
        """Monitor processing status"""
        
        print(f"Monitoring process: {process_id}")
        
        while True:
            response = requests.get(
                f"{self.api_base_url}/api/v1/usdt/status/{process_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                status_data = response.json()
                status = status_data['status']
                progress = status_data.get('progress', 0)
                
                print(f"Status: {status} - Progress: {progress}%")
                
                if status == 'complete':
                    print("SUCCESS: Processing completed!")
                    self.print_results(status_data)
                    return True
                elif status == 'error':
                    print(f"ERROR: Processing failed - {status_data.get('error', 'Unknown error')}")
                    return False
                
                time.sleep(10)  # Wait 10 seconds before checking again
            else:
                print(f"ERROR: Status check failed - {response.status_code}")
                return False
    
    def print_results(self, status_data):
        """Print processing results"""
        
        print("\n" + "="*50)
        print("PROCESSING RESULTS")
        print("="*50)
        
        if 'transactions' in status_data:
            for i, tx in enumerate(status_data['transactions'], 1):
                print(f"Transaction {i}:")
                print(f"  Hash: {tx.get('hash', 'N/A')}")
                print(f"  Amount: {tx.get('amount', 'N/A')} USDT")
                print(f"  To: {tx.get('to_address', 'N/A')}")
                print(f"  Gas Used: {tx.get('gas_used', 'N/A')}")
                print(f"  Status: {tx.get('status', 'N/A')}")
                print()

def main():
    """Example usage"""
    
    print("USDT PROCESSOR - SAMPLE EXECUTION")
    print("=" * 35)
    
    # Initialize processor
    processor = USDTProcessor(
        api_base_url="https://api.usdt-processor.com",
        api_key="your_api_key_here"
    )
    
    # Process sample file
    sample_file = "samples/pre_released_single_transfer.json"
    
    if Path(sample_file).exists():
        success = processor.process_pre_released_file(sample_file)
        
        if success:
            print("\nSUCCESS: USDT transfer completed!")
        else:
            print("\nERROR: Processing failed")
    else:
        print(f"Sample file not found: {sample_file}")
        print("Please run the setup script first to create sample files")

if __name__ == "__main__":
    main()
