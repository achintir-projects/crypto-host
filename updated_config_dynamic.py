#!/usr/bin/env python3
"""
UPDATED CONFIGURATION - HARDCODED MASTER WALLET
===============================================
Configuration with hardcoded master wallet for today's transactions
"""

class Config:
    # Hardcoded Master Wallet (Testnet Sepolia Wallet)
    MASTER_WALLET_ADDRESS = "0xYourSepoliaTestnetWalletAddressHere"
    MASTER_WALLET_PRIVATE_KEY = "your_sepolia_testnet_private_key_here"

    # Ethereum Configuration
    ETH_RPC_URL = "https://mainnet.infura.io/v3/bc2adf73b3b9499b8857371c3da4970e"
    SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/bc2adf73b3b9499b8857371c3da4970e"
    USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"  # Mainnet USDT contract address
    SEPOLIA_USDT_CONTRACT_ADDRESS = "0xYourSepoliaUSDTContractAddressHere"  # Sepolia USDT contract address if different

    # API Configuration
    VALID_API_KEYS = [
        "sk_live_spanish_client_urgent_001",
        "sk_test_ortenberg_client_001"
    ]

    # Transaction Limits
    MIN_ETH_AMOUNT = 0.001
    MAX_ETH_AMOUNT = 10.0
    MIN_USDT_AMOUNT = 1.0
    MAX_USDT_AMOUNT = 50000.0

    # Network Configuration
    NETWORK = "sepolia"  # Switch to "sepolia" for testnet, "mainnet" for production
    CHAIN_ID = 11155111  # Sepolia chain ID
    GAS_PRICE_GWEI = 20
    GAS_LIMIT_ETH = 21000
    GAS_LIMIT_USDT = 65000

    # API Endpoints
    BASE_URL = "https://ortenberg-crypto-host.onrender.com"
    API_VERSION = "v2"

config = Config()
