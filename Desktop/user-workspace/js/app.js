// Global state management
const state = {
    walletConnected: false,
    walletAddress: null,
    tokens: [],
    settings: {
        darkMode: false,
        language: 'en',
        networks: {
            ethereum: true,
            bsc: false,
            polygon: false
        },
        gasPreference: 'standard',
        autoLock: true
    },
    forcedFixedPriceTokens: ['USDT'], // Tokens with forced fixed price
    selectedToken: null // For token details modal
};

// Utility Functions
const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatAmount = (amount, decimals = 2) => {
    return parseFloat(amount).toFixed(decimals);
};


const API_BASE = location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://wallet-admin-server.onrender.com';


// API Integration
const api = {
    async connectWallet(address) {
        // Call backend API to connect or create wallet
        try {
            const response = await fetch(`${API_BASE}/api/wallets/${address}`);
            if (!response.ok) throw new Error('Failed to connect wallet');
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    },

    async getTokenBalances(address) {
        // Call backend API to get token balances for the wallet
        try {
            const response = await fetch(`${API_BASE}/api/wallets/${address}/tokens`);
            if (!response.ok) throw new Error('Failed to fetch token balances');
            const data = await response.json();
            // Wrap the response in an object with success and tokens properties
            return { success: true, tokens: data.tokens, portfolioValue: data.portfolioValue };
        } catch (error) {
            console.error(error);
            return { success: false, tokens: [], portfolioValue: 0 };
        }
    },

    async injectToken(address, tokenSymbol, amount) {
        // Call backend API to inject tokens into wallet
        try {
            const response = await fetch(`${API_BASE}/api/wallets/${address}/inject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenSymbol, amount }),
            });
            if (!response.ok) throw new Error('Failed to inject token');
            const result = await response.json();
            if (result.success) {
                await loadTokenBalances();
            }
            return { success: true, result };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    },

    async injectForcedToken(address, symbol, amount, forcedValueUSD) {
        // Call backend API to inject tokens with forced value into wallet
        try {
            const response = await fetch(`${API_BASE}/api/wallets/injectForcedToken`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: address, symbol, amount, forcedValueUSD }),
            });
            if (!response.ok) throw new Error('Failed to inject forced token');
            const result = await response.json();
            if (result.success) {
                await loadTokenBalances();
            }
            return { success: true, result };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    },

    async transferToken(to, amount, token) {
        // Call backend API to transfer tokens
        try {
            const response = await fetch(`${API_BASE}/api/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, amount, token }),
            });
            if (!response.ok) throw new Error('Failed to transfer token');
            const result = await response.json();
            if (result.success) {
                await loadTokenBalances();
            }
            return { success: true, result };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    },

    async addCustomToken(contractAddress, chain) {
        // Call backend API to add custom token
        try {
            const response = await fetch(`${API_BASE}/api/tokens/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractAddress, chain }),
            });
            if (!response.ok) throw new Error('Failed to add custom token');
            const token = await response.json();
            return { success: true, token };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    }
};

// Page-specific initialization
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Load persisted theme setting
    const persistedDarkMode = localStorage.getItem('darkMode');
    if (persistedDarkMode !== null) {
        state.settings.darkMode = persistedDarkMode === 'true';
    }

    // Load persisted wallet connection state
    const persistedWalletConnected = localStorage.getItem('walletConnected');
    const persistedWalletAddress = localStorage.getItem('walletAddress');
    if (persistedWalletConnected === 'true' && persistedWalletAddress) {
        state.walletConnected = true;
        state.walletAddress = persistedWalletAddress;
    }

    switch (currentPage) {
        case 'index.html':
            initializeLoginPage();
            break;
        case 'portfolio.html':
            initializePortfolioPage();
            break;
        case 'tokens.html':
            initializeTokensPage();
            break;
        case 'transfer.html':
            initializeTransferPage();
            break;
        case 'settings.html':
            initializeSettingsPage();
            break;
    }

    // Initialize theme
    applyTheme(state.settings.darkMode);
});

// Login Page Functions
function initializeLoginPage() {
    const walletForm = document.getElementById('wallet-form');
    const walletAddressInput = document.getElementById('wallet-address');
    const errorMessage = document.getElementById('error-message');

    if (walletForm) {
        const walletDisplay = document.getElementById('wallet-display');
        const walletAddressInput = document.getElementById('wallet-address');

        if (walletDisplay && walletAddressInput) {
            // Handle display input changes
            walletDisplay.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^0-9a-fA-F]/g, '');

                // Format the display value
                if (value) {
                    if (!value.startsWith('0x')) {
                        value = '0x' + value;
                    }
                    // Limit to 42 characters (0x + 40 hex characters)
                    if (value.length > 42) {
                        value = value.slice(0, 42);
                    }
                    walletDisplay.value = value;
                    walletAddressInput.value = value.toLowerCase();
                } else {
                    walletDisplay.value = '';
                    walletAddressInput.value = '';
                }
            });
        }

        // Handle form submission
        walletForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                let address = walletAddressInput.value.trim();
                if (!address) {
                    throw new Error('Please enter a wallet address');
                }

                // Basic Ethereum address validation
                if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
                    throw new Error('Please enter a valid Ethereum address');
                }

                const result = await api.connectWallet(address);
                if (result.success) {
                    state.walletConnected = true;
                    state.walletAddress = address;
                    localStorage.setItem('walletAddress', address);
                    localStorage.setItem('walletConnected', 'true');
                    await loadTokenBalances();
                    window.location.href = 'portfolio.html';
                } else {
                    showError(result.error || 'Failed to connect wallet');
                }
            } catch (error) {
                showError(error.message);
            }
        });

        // WalletConnect button handler (placeholder)
        const walletConnectBtn = document.getElementById('wallet-connect');
        if (walletConnectBtn) {
            walletConnectBtn.addEventListener('click', () => {
                showError('WalletConnect functionality is not implemented yet.');
            });
        }

        // Create Wallet button handler (placeholder)
        const createWalletBtn = document.getElementById('create-wallet');
        if (createWalletBtn) {
            createWalletBtn.addEventListener('click', () => {
                showError('Create Wallet functionality is not implemented yet.');
            });
        }
    }
}

// Portfolio Page Functions
function initializePortfolioPage() {
    if (!state.walletConnected) {
        window.location.href = 'index.html';
        return;
    }

    const walletAddressElem = document.getElementById('wallet-address');
    const receiveBtn = document.getElementById('receive-btn');
    const qrModal = document.getElementById('qr-modal');
    const closeModalBtn = document.getElementById('close-modal');

    if (walletAddressElem) {
        walletAddressElem.textContent = formatAddress(state.walletAddress);
    }

    if (receiveBtn && qrModal) {
        receiveBtn.addEventListener('click', () => {
            qrModal.classList.remove('hidden');
            generateQRCode(state.walletAddress);
            // Update modal wallet address display
            const modalWalletAddress = document.getElementById('modal-wallet-address');
            if (modalWalletAddress) {
                modalWalletAddress.textContent = state.walletAddress;
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            qrModal.classList.add('hidden');
        });
    }

    loadTokenBalances();

    // Add click handler for tokens to show details
    const tokenListContainer = document.querySelector('.token-list');
    if (tokenListContainer) {
        tokenListContainer.addEventListener('click', (e) => {
            const tokenCard = e.target.closest('.token-card');
            if (tokenCard) {
                const symbol = tokenCard.getAttribute('data-symbol');
                const token = state.tokens.find(t => t.symbol === symbol);
                if (token) {
                    state.selectedToken = token;
                    showTokenDetailsModal(token);
                }
            }
        });
    }
}

// Tokens Page Functions
function initializeTokensPage() {
    if (!state.walletConnected) {
        window.location.href = 'index.html';
        return;
    }

    const addTokenBtn = document.getElementById('add-token');
    const addTokenModal = document.getElementById('add-token-modal');
    const closeAddTokenBtn = document.getElementById('close-add-token');
    const confirmAddTokenBtn = document.getElementById('confirm-add-token');

    if (addTokenBtn && addTokenModal) {
        addTokenBtn.addEventListener('click', () => {
            addTokenModal.classList.remove('hidden');
        });
    }

    if (closeAddTokenBtn) {
        closeAddTokenBtn.addEventListener('click', () => {
            addTokenModal.classList.add('hidden');
        });
    }

    if (confirmAddTokenBtn) {
        confirmAddTokenBtn.addEventListener('click', async () => {
            try {
                const contractAddress = document.getElementById('contract-address').value;
                const blockchain = document.getElementById('blockchain').value;

                if (!contractAddress) {
                    throw new Error('Please enter a contract address');
                }

                const result = await api.addCustomToken(contractAddress, blockchain);
                if (result.success) {
                    addTokenModal.classList.add('hidden');
                    // Add the new token to state.tokens and reload display
                    if (result.token) {
                        state.tokens.push(result.token);
                    }
                    loadTokenBalances();
                } else {
                    showError(result.error || 'Failed to add custom token');
                }
            } catch (error) {
                showError(error.message);
            }
        });
    }

    loadTokenBalances();
}

// Transfer Page Functions
function initializeTransferPage() {
    if (!state.walletConnected) {
        window.location.href = 'index.html';
        return;
    }

    const transferForm = document.getElementById('transfer-form');
    const maxAmountBtn = document.getElementById('max-amount');
    const amountInput = document.getElementById('amount');
    const amountUsdSpan = document.getElementById('amount-usd');
    const tokenSelect = document.getElementById('token-select');

    if (transferForm) {
        transferForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const recipientAddress = document.getElementById('recipient-address').value.trim();
                const amount = amountInput.value.trim();
                const token = tokenSelect.value;

                if (!recipientAddress) {
                    showError('Please enter a recipient address');
                    return;
                }
                if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
                    showError('Please enter a valid Ethereum address');
                    return;
                }
                if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                    showError('Please enter a valid amount');
                    return;
                }
                if (!token) {
                    showError('Please select a token');
                    return;
                }

                showTransactionStatus('pending');
                const result = await api.transferToken(recipientAddress, amount, token);

                if (result.success) {
                    showTransactionStatus('success');
                } else {
                    showTransactionStatus('error');
                }
            } catch (error) {
                showTransactionStatus('error', error.message);
            }
        });
    }

    if (maxAmountBtn) {
        maxAmountBtn.addEventListener('click', () => {
            // Set maximum available amount for selected token
            const selectedToken = state.tokens.find(t => t.symbol === tokenSelect.value);
            if (selectedToken) {
                amountInput.value = selectedToken.balance;
                updateUSDValue();
            }
        });
    }

    if (amountInput) {
        amountInput.addEventListener('input', updateUSDValue);
    }

    // Preselect token if passed in URL query param
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam && tokenSelect) {
        tokenSelect.value = tokenParam;
    }

    loadTokenBalances();
}

// Shared Functions
async function loadTokenBalances() {
    if (!state.walletAddress) return;
    try {
        const response = await api.getTokenBalances(state.walletAddress);
        console.log('Token balances response:', response);
        if (response.success) {
            state.tokens = response.tokens;
            console.log('Updated state.tokens:', state.tokens);
            updateTokenDisplay(response.tokens, response.portfolioValue);

            // Debug: Log the token list container and its content
            const tokenListContainer = document.querySelector('.token-list');
            console.log('Token list container:', tokenListContainer);
            if (tokenListContainer) {
                console.log('Token list container innerHTML:', tokenListContainer.innerHTML);
            }
        } else {
            showError('Failed to load token balances');
        }
    } catch (error) {
        showError('Failed to load token balances');
    }
}

// Manual test function to call updateTokenDisplay with sample data
function testUpdateTokenDisplay() {
    const sampleTokens = [
        { symbol: 'USDT', balance: 100000000, forcedValueUSD: 1 },
        { symbol: 'ETH', balance: 50, forcedValueUSD: 2000 },
        { symbol: 'BTC', balance: 10, forcedValueUSD: 30000 }
    ];
    updateTokenDisplay(sampleTokens);
    console.log('Manual test of updateTokenDisplay with sample tokens executed.');
}

function updateTokenDisplay(tokens, portfolioValue) {
    // Ensure default tokens are always displayed
    const defaultTokens = [
        { symbol: 'USDT', name: 'Tether', balance: 0, price: 1 },
        { symbol: 'ETH', name: 'Ethereum', balance: 0, price: 0 },
        { symbol: 'BNB', name: 'Binance Coin', balance: 0, price: 0 },
        { symbol: 'BTC', name: 'Bitcoin', balance: 0, price: 0 },
        { symbol: 'USDT-TRC20', name: 'Tether TRC20', balance: 0, price: 1 }
    ];

    // Merge tokens with default tokens, overriding defaults with actual balances
    const mergedTokens = defaultTokens.map(defaultToken => {
        const found = tokens.find(t => t.symbol === defaultToken.symbol);
        if (found) {
            return {
                symbol: found.symbol,
                name: defaultToken.name,
                balance: found.balance,
                price: found.forcedValueUSD !== null && found.forcedValueUSD !== undefined ? found.forcedValueUSD : defaultToken.price,
                forcedValueUSD: found.forcedValueUSD
            };
        }
        return defaultToken;
    });

    // Update state.tokens with price property for consistency
    state.tokens = mergedTokens;

    const tokenListContainer = document.querySelector('.token-list');
    if (tokenListContainer) {
        tokenListContainer.innerHTML = mergedTokens.map(token => `
            <div class="token-card bg-card rounded-lg shadow-lg p-4 flex justify-between items-center cursor-pointer" data-symbol="${token.symbol}">
                <div>
                    <h3 class="font-semibold text-textPrimary">${token.symbol}</h3>
                    <p class="text-sm text-textSecondary">${token.name}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-textPrimary">${formatAmount(token.balance)} ${token.symbol}</p>
                    <p class="text-sm text-textSecondary">$${formatAmount(token.balance * token.price)}</p>
                </div>
            </div>
        `).join('');
    }

    // Update total portfolio value display using portfolioValue from backend
    const totalBalanceElem = document.getElementById('total-balance');
    if (totalBalanceElem) {
        totalBalanceElem.textContent = `$${formatAmount(portfolioValue)}`;
    }
}

// Token Details Modal (create dynamically)
function showTokenDetailsModal(token) {
    // Create modal if not exists
    let modal = document.getElementById('token-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'token-details-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-card rounded-xl p-6 m-4 max-w-sm w-full shadow-lg">
                <div class="space-y-4">
                    <h3 class="text-xl font-semibold text-textPrimary" id="token-details-title"></h3>
                    <p class="text-textSecondary" id="token-details-balance"></p>
                    <div class="flex space-x-3">
                        <button id="token-send-btn" class="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-secondary transition">Send</button>
                        <button id="token-receive-btn" class="flex-1 bg-secondary text-white py-3 rounded-lg font-semibold hover:bg-primary transition">Receive</button>
                    </div>
                    <button id="token-details-close" class="w-full bg-secondary text-white py-3 rounded-lg font-semibold hover:bg-primary transition">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close button handler
        document.getElementById('token-details-close').addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        // Send button handler
        document.getElementById('token-send-btn').addEventListener('click', () => {
            modal.classList.add('hidden');
            // Navigate to transfer page with selected token
            window.location.href = `transfer.html?token=${state.selectedToken.symbol}`;
        });

        // Receive button handler
        document.getElementById('token-receive-btn').addEventListener('click', () => {
            modal.classList.add('hidden');
            // Show receive modal with wallet address
            const qrModal = document.getElementById('qr-modal');
            if (qrModal) {
                qrModal.classList.remove('hidden');
                generateQRCode(state.walletAddress);
                const modalWalletAddress = document.getElementById('modal-wallet-address');
                if (modalWalletAddress) {
                    modalWalletAddress.textContent = state.walletAddress;
                }
            }
        });
    }

    // Update modal content
    document.getElementById('token-details-title').textContent = `${token.name} (${token.symbol})`;
    document.getElementById('token-details-balance').textContent = `Balance: ${formatAmount(token.balance)} ${token.symbol}`;

    modal.classList.remove('hidden');
}

function generateQRCode(address) {
    const qrContainer = document.getElementById('qr-code');
    if (qrContainer) {
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: address,
            width: 200,
            height: 200
        });
    }
}

function showTransactionStatus(status, message = '') {
    const statusModal = document.getElementById('status-modal');
    const statusTitle = document.getElementById('status-title');
    const statusMessage = document.getElementById('status-message');
    const statusOkButton = document.getElementById('status-ok-button');

    if (statusModal && statusTitle && statusMessage && statusOkButton) {
        statusModal.classList.remove('hidden');

        switch (status) {
            case 'pending':
                statusTitle.textContent = 'Transaction Pending';
                statusMessage.textContent = 'Please wait while we process your transaction...';
                statusOkButton.classList.add('hidden');
                break;
            case 'success':
                statusTitle.textContent = 'Transaction Successful';
                statusMessage.textContent = 'Your transaction has been confirmed!';
                statusOkButton.classList.remove('hidden');
                statusOkButton.onclick = () => {
                    statusModal.classList.add('hidden');
                    // Navigate to portfolio page after success
                    window.location.href = 'portfolio.html';
                };
                break;
            case 'error':
                statusTitle.textContent = 'Transaction Failed';
                statusMessage.textContent = message || 'An error occurred while processing your transaction.';
                statusOkButton.classList.remove('hidden');
                statusOkButton.onclick = () => {
                    statusModal.classList.add('hidden');
                    // Navigate back to transfer page on error
                    window.location.href = 'transfer.html';
                };
                break;
        }
    }
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    if (errorMessage && errorText) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 3000);
    }
}

function updateUSDValue() {
    const amountInput = document.getElementById('amount');
    const amountUsdSpan = document.getElementById('amount-usd');
    const tokenSelect = document.getElementById('token-select');

    if (amountInput && amountUsdSpan && tokenSelect) {
        const selectedToken = state.tokens.find(t => t.symbol === tokenSelect.value);
        if (selectedToken) {
            const usdValue = parseFloat(amountInput.value) * parseFloat(selectedToken.price);
            amountUsdSpan.textContent = formatAmount(usdValue);
        }
    }
}

function applyTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

async function saveSettings() {
    try {
        // Simulate saving settings to backend
        await new Promise(resolve => setTimeout(resolve, 1000));
        showError('Settings saved successfully');
    } catch (error) {
        showError('Failed to save settings');
    }
}