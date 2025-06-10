#!/bin/bash
echo "?? Starting Spanish Client USDT Processor..."
python -m uvicorn rapid_deployment_complete:app --host 0.0.0.0 --port 8000 --reload
