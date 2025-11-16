# Installing forge-std

The `forge-std` library is required for tests and scripts. To install it:

## Option 1: Using forge install (Recommended)

Run this command in the `Backend` directory:

```bash
forge install foundry-rs/forge-std --no-commit
```

## Option 2: Manual Installation

If `forge install` doesn't work, you can manually clone the repository:

```bash
cd Backend/lib
git clone https://github.com/foundry-rs/forge-std.git
```

## Verify Installation

After installation, you should see files in `Backend/lib/forge-std/src/` including:
- `Script.sol`
- `Test.sol`
- Other forge-std files

Then run:
```bash
forge build
```

The remappings are already configured in `foundry.toml` and `remappings.txt`.

