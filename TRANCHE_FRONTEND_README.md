# Tranche Frontend Integration - README

## Overview

This document describes the new Tranche Dashboard UI components and hooks that have been added to the Procti frontend. **All new files are additions - no existing code was modified.**

## New Files Created

### Infrastructure (`lib/procti/`)
- **`addresses.ts`** - Contract addresses and tranche metadata
- **`abi.ts`** - Contract ABIs (placeholder - update after deployment)

### Hooks (`hooks/`)
- **`useProctiContract.ts`** - Hook for contract interactions (deposit, withdraw, updateEpoch)
- **`useTrancheData.ts`** - Hook for reading tranche data (values, positions, share prices)
- **`useEvents.ts`** - Hook for listening to contract events

### Components (`components/tranches/`)
- **`TrancheCard.tsx`** - Display card for each tranche (Senior, Mezz, Junior)
- **`DepositPanel.tsx`** - Panel for depositing USDC into tranches
- **`WithdrawPanel.tsx`** - Panel for withdrawing shares from tranches
- **`EpochPanel.tsx`** - Admin panel for updating epochs (owner only)
- **`VaultOverview.tsx`** - Overview of vault metrics and tranche distribution
- **`HistoryTable.tsx`** - Table displaying vault event history

### Pages (`app/tranches/`)
- **`page.tsx`** - Main tranche dashboard page (new route: `/tranches`)

## Setup Instructions

### 1. Update Contract Addresses

After deploying TrancheVault, update `lib/procti/addresses.ts`:

```typescript
export const TRANCHE_VAULT_ADDRESS = "0x..."; // Your deployed address
export const MOCK_SCORING_ADDRESS = "0x...";  // Optional
```

### 2. Update ABI

After running `forge build` and copying ABIs:

1. Copy `TrancheVault.json` from `Backend/abi/` to `abi/`
2. Update `lib/procti/abi.ts` to import the actual ABI:

```typescript
import TrancheVaultABI from "../../abi/TrancheVault.json";
export const TRANCHE_VAULT_ABI = TrancheVaultABI.abi;
```

### 3. Access the Dashboard

Navigate to `/tranches` in your browser to access the new tranche dashboard.

## Features

### Vault Overview
- Total virtual vault value
- Tranche distribution with percentages
- Visual progress bars for each tranche

### Tranche Cards
- Display for each tranche (Senior, Mezzanine, Junior)
- User's shares and value
- Share price
- Estimated APY
- Risk level indicators

### Deposit Panel
- Select tranche
- Enter USDC amount
- Estimate shares before depositing
- Automatic USDC approval

### Withdraw Panel
- Select tranche
- Enter shares to withdraw
- Max button for convenience
- Shows available shares and value

### Epoch Panel (Admin Only)
- Set yield, security, and liquidity scores
- Preset scenarios (positive, negative, neutral)
- Real-time delta calculations
- Update epoch function

### Event History
- All vault events (Deposit, Withdraw, EpochUpdated, LossApplied)
- Timestamps and block numbers
- User-filtered events
- Detailed event information

## Integration Notes

### Non-Intrusive Design
- All new components are isolated
- Uses existing wallet/provider infrastructure
- Does NOT modify existing hooks or components
- New route does NOT affect existing pages

### Hook Architecture
- **useProctiContract**: Uses existing wagmi hooks, doesn't create new providers
- **useTrancheData**: Isolated data fetching, auto-refreshes every 5 seconds
- **useEvents**: Local state management, doesn't interfere with global state

### Styling
- Uses Tailwind CSS (consistent with existing design)
- Scoped to new components only
- Does NOT modify global styles

## Usage Example

```tsx
import { useProctiContract } from "@/hooks/useProctiContract";
import { useTrancheData } from "@/hooks/useTrancheData";
import { Tranche } from "@/lib/procti/addresses";

function MyComponent() {
  const { deposit, withdraw } = useProctiContract();
  const { userPositions, trancheValues } = useTrancheData();

  const handleDeposit = async () => {
    await deposit("1000", Tranche.Senior);
  };

  return (
    <div>
      <p>Senior Value: {trancheValues.senior} USDC</p>
      <p>Your Shares: {userPositions[Tranche.Senior].shares}</p>
    </div>
  );
}
```

## Troubleshooting

### Contract Not Found
- Ensure `TRANCHE_VAULT_ADDRESS` is set correctly
- Check that contract is deployed on the correct network

### ABI Errors
- Update `lib/procti/abi.ts` with actual ABI after deployment
- Run `forge build` and copy ABIs using the script

### Events Not Loading
- Events hook uses simplified parsing - may need ABI-based decoding
- Check that contract address is correct
- Verify network connection

### Owner Check Failing
- Ensure wallet is connected
- Verify connected address matches contract owner
- Check `useProctiContract` hook's `isOwner` logic

## Next Steps

1. Deploy TrancheVault contract
2. Update addresses in `lib/procti/addresses.ts`
3. Update ABI in `lib/procti/abi.ts`
4. Test all functionality on testnet
5. Add link to `/tranches` from main page (optional)

## File Structure

```
procti/
├── lib/
│   └── procti/
│       ├── addresses.ts      (NEW)
│       └── abi.ts            (NEW)
├── hooks/
│   ├── useProctiContract.ts (NEW)
│   ├── useTrancheData.ts    (NEW)
│   └── useEvents.ts         (NEW)
├── components/
│   └── tranches/
│       ├── TrancheCard.tsx   (NEW)
│       ├── DepositPanel.tsx  (NEW)
│       ├── WithdrawPanel.tsx (NEW)
│       ├── EpochPanel.tsx    (NEW)
│       ├── VaultOverview.tsx (NEW)
│       └── HistoryTable.tsx  (NEW)
└── app/
    └── tranches/
        └── page.tsx           (NEW)
```

All existing files remain unchanged! ✅

