# Migration from Injective/Keplr to Somnia/MetaMask - Summary

## ✅ Completed Changes

### 1. Wallet Connection Layer
- **File**: `wallet/connectWallet.ts`
  - Replaced Keplr wallet connection with MetaMask using `connectWalletToSomnia()`
  - Updated storage key from `injectiveAddress` to `walletAddress`
  - Changed API call to use `createSomnia` instead of `createInjective`

- **File**: `wallet/walletConnection.ts`
  - Removed Injective `WalletStrategy` and replaced with MetaMask provider
  - Implemented ethers.js based message signing for authentication
  - Updated API headers from `injectiveAddress` to `walletAddress`

### 2. Utilities
- **File**: `app/utils.ts`
  - Removed all Injective SDK imports (`@injectivelabs/wallet-ts`, `@injectivelabs/networks`)
  - Replaced with ethers.js utilities:
    - `getEthereumProvider()` - Gets MetaMask provider
    - `getSigner()` - Gets ethers signer for transactions

### 3. UI Components
- **File**: `app/components/earlyAccessPage.tsx`
  - Replaced Keplr/Leap wallet buttons with single MetaMask button
  - Updated whitelist checking from Injective smart contract to API-based approach
  - Added fallback to show network addition guide when connection fails
  - Changed all `injectiveAddress` references to `walletAddress`

- **New File**: `app/components/AddSomniaNetworkGuide.tsx`
  - Created helper component to guide users through manual network addition
  - Displays all network details with copy-to-clipboard functionality
  - Shows step-by-step instructions for adding Somnia to MetaMask

### 4. Dependencies
- **File**: `package.json`
  - Removed:
    - `@injectivelabs/sdk-ts`
    - `@injectivelabs/wallet-ts`
    - `@keplr-wallet/cosmos`
    - `@keplr-wallet/provider-extension`
    - `@cosmjs/launchpad`
  - Added:
    - `ethers: ^6.13.0` (explicitly)

### 5. Somnia Network Configuration
- **Existing Files** (already in place):
  - `lib/somnia-wallet.ts` - Complete MetaMask/Somnia utilities
  - `lib/somnia-config.ts` - Network configuration
  - `wallet/somniaConfig.ts` - Wallet-specific Somnia config

## ⚠️ Critical Issue: Incorrect RPC URL

**Problem**: The RPC URL `https://testnet.somnia.network` appears to be the website, not the actual RPC endpoint. MetaMask cannot connect because:
- The URL returns a 405 (Method Not Allowed) for JSON-RPC POST requests
- It only serves HTML content for GET requests

**Solution Needed**: 
You need to find the correct RPC URL from:
1. Official Somnia documentation
2. Somnia Discord server
3. The "Add Testnet" button on https://testnet.somnia.network (check what URL it uses)

Common patterns for RPC URLs:
- `https://rpc.testnet.somnia.network`
- `https://testnet-rpc.somnia.network`
- `https://rpc-testnet.somnia.network`

Once you have the correct URL, update it in:
- `.env.local` (both `SOMNIA_RPC_URL` and `NEXT_PUBLIC_SOMNIA_RPC_URL`)
- The app will automatically pick it up

## 🔧 Remaining Tasks

### 1. High Priority - API Routes
Update all API routes that reference `injectiveAddress`:
- [ ] `app/api/users/route.ts` - Change header from `injectiveAddress` to `walletAddress`
- [ ] `app/api/auth/nonce/route.ts` - Update address handling
- [ ] `app/api/auth/verifyArbitrary/route.ts` - Update signature verification for Ethereum signatures
- [ ] `app/api/db/route.ts` - Change `createInjective` to `createSomnia`
- [ ] Create `app/api/whitelist/check/route.ts` - New endpoint for whitelist checking
- [ ] Create `app/api/whitelist/join/route.ts` - New endpoint for joining whitelist

### 2. Medium Priority - UI Components  
Components still using `injectiveAddress` prop name:
- [ ] `app/page.tsx` - Rename `injectiveAddress` state to `walletAddress`
- [ ] `app/components/header.tsx` - Update prop names
- [ ] `app/components/menu.tsx` - Update prop names
- [ ] All message type components (balance, validators, swap, send, etc.)

### 3. Medium Priority - AI Tools & Tasks
Files in `ai/tasks/` and `ai/tools/` that interact with blockchain:
- [ ] `ai/tasks/stakeInjective.ts` - Convert to Somnia staking (or remove if not applicable)
- [ ] `ai/tasks/unstakeInjective.ts` - Convert to Somnia unstaking
- [ ] `ai/tasks/tokenSwap.ts` - Update for Somnia DEX
- [ ] `ai/tasks/transferFunds.ts` - Update for Somnia transfers
- [ ] `ai/tasks/fetchBalance.ts` - Use ethers.js to fetch ETH/STT balance
- [ ] `ai/tasks/fetchUserPortfolio.ts` - Update for Somnia
- [ ] `ai/tools/executeSwap.ts` - Update for Somnia
- [ ] `ai/tools/transferTool.ts` - Update for Somnia
- [ ] `ai/tools/stakeTool.ts` - Update for Somnia
- [ ] `ai/tools/injectiveMetrics.ts` - Convert to Somnia metrics

### 4. Low Priority - Services
- [ ] `app/services/userMessage.ts` - Rename `crateInjectiveIfNotExists` to `createWalletIfNotExists`
- [ ] `app/referralUtils.ts` - Update to use wallet addresses

### 5. Database Schema
- [ ] Update database tables to use `wallet_address` instead of `injective_address`
- [ ] Create migration script if needed

## 🚀 Quick Start After Migration

1. **Find correct RPC URL** and update `.env.local`
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Test wallet connection**:
   - Open browser console
   - Click "Connect with MetaMask"
   - Check console logs for network config
   - Manually add network if automatic addition fails

4. **Update API routes** (priority 1 tasks above)

5. **Update remaining components** to use `walletAddress` instead of `injectiveAddress`

## 📝 Notes

- The core wallet infrastructure is now Somnia/MetaMask compatible
- All Injective dependencies have been removed
- Users will see helpful guide if network addition fails
- Signature verification needs to be updated for Ethereum-style signatures (different from Cosmos)
- Smart contract interactions will need to use ethers.js instead of Injective SDK

## 🆘 Help Needed

**Most Important**: Get the correct Somnia RPC URL from the team or documentation. Without it, wallet connection cannot work.
