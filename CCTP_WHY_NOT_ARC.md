# Arc Testnet CCTP Support

## ✅ Arc Testnet DOES Support CCTP!

**Arc Testnet has official CCTP support!** According to the [Arc Network documentation](https://docs.arc.network/arc/references/contract-addresses), Circle has deployed CCTP V2 contracts on Arc Testnet.

## Arc Testnet CCTP Contracts

According to the [official Arc documentation](https://docs.arc.network/arc/references/contract-addresses#cctp):

| Contract | Address | Domain |
|----------|---------|--------|
| **TokenMessengerV2** | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` | 26 |
| **MessageTransmitterV2** | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` | 26 |
| **TokenMinterV2** | `0xb43db544E2c27092c107639Ad201b3dEfAbcF192` | 26 |
| **MessageV2** | `0xbaC0179bB358A8936169a63408C8481D582390C4` | 26 |

**USDC Address:** `0x3600000000000000000000000000000000000000` (Native USDC on Arc)

**Domain ID:** 26

## What This Means

- ✅ **Arc Testnet USDC can be bridged using CCTP**
- ✅ **You can bridge from Arc Testnet to other CCTP-supported chains**
- ✅ **You can bridge to Arc Testnet from other CCTP-supported chains**
- ✅ **Get testnet USDC from Circle's faucet: https://faucet.circle.com**

## How to Use CCTP on Arc Testnet

1. **Get Testnet USDC:**
   - Visit [Circle's Faucet](https://faucet.circle.com)
   - Select **Arc Testnet** as the network
   - Request testnet USDC

2. **Bridge from Arc Testnet:**
   - Use the bridge component in the app
   - Select "Arc" as the source chain
   - Select any CCTP-supported destination chain
   - Bridge your USDC

3. **Bridge to Arc Testnet:**
   - Bridge from any CCTP-supported chain
   - Select "Arc" as the destination chain
   - Your USDC will arrive on Arc Testnet

## Supported Chains for CCTP

**Mainnet:**
- Ethereum, Base, Arbitrum, Optimism, Avalanche, Polygon

**Testnet:**
- Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia
- **Arc Testnet** ✅

## Implementation Details

The app has been updated to support Arc Testnet CCTP:
- Added Arc Testnet contract addresses to `useCCTP.ts`
- Set Arc Testnet domain ID to 26
- Added "Arc" to the list of CCTP-supported chains
- Removed warnings about Arc Testnet not supporting CCTP

## References

- [Arc Network CCTP Documentation](https://docs.arc.network/arc/references/contract-addresses#cctp)
- [Circle CCTP Documentation](https://developers.circle.com/cctp)
- [Circle Testnet Faucet](https://faucet.circle.com)
