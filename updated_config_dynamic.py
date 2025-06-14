#!/usr/bin/env python3
"""
UPDATED CONFIGURATION - HARDCODED MASTER WALLET
===============================================
Configuration with hardcoded master wallet for today's transactions
"""

class Config:
    # Hardcoded Master Wallet
    MASTER_WALLET_ADDRESS = "0x10ead6370820315F6d5a517c2166cBa4a564216b"
    MASTER_WALLET_PRIVATE_KEY = "da8348eba2fec0ec5c92165a8b5349fb2e3c33de29b32ab72589467da73788ed"

    # Ethereum Configuration
    ETH_RPC_URL = "https://mainnet.infura.io/v3/bc2adf73b3b9499b8857371c3da4970e"
    SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/bc2adf73b3b9499b8857371c3da4970e"
    USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"

    # API Configuration
    VALID_API_KEYS = [
        "sk_live_spanish_client_urgent_001",
        "sk_test_spanish_client_dev_001"
    ]

    # Transaction Limits
    MIN_ETH_AMOUNT = 0.001
    MAX_ETH_AMOUNT = 10.0
    MIN_USDT_AMOUNT = 1.0
    MAX_USDT_AMOUNT = 50000.0

    # Network Configuration
    NETWORK = "mainnet"
    CHAIN_ID = 1
    GAS_PRICE_GWEI = 20
    GAS_LIMIT_ETH = 21000
    GAS_LIMIT_USDT = 65000

    # API Endpoints
    BASE_URL = "https://ortenberg-crypto-host.onrender.com"
    API_VERSION = "v2"

config = Config()
