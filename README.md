# Ortenberg Crypto Host

Enterprise-grade cryptocurrency processing system for USDT transactions on Ethereum mainnet.

## Features

- ? USDT Transaction Processing
- ? Multi-RPC Redundancy
- ? Real-time Transaction Monitoring
- ? Enterprise Security
- ? RESTful API
- ? Production Ready

## API Endpoints

- `GET /health` - Health check
- `POST /api/v2/usdt/process` - Process USDT transaction
- `GET /api/v2/usdt/status/{id}` - Check transaction status
- `GET /api/v2/master-wallet/info` - Master wallet information

## Deployment

### Render Deployment
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### Local Development
```bash
pip install -r requirements.txt
python app.py
