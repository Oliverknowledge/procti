# 🤖 AI Agent Capabilities

## Overview
The Procti AI Agent is a conversational interface that allows users to interact with the entire DeFi vault system through natural language. It can execute blockchain transactions, show/hide UI components, provide information, and manage your portfolio.

---

## 💬 Conversational Commands

### 💰 **Deposit & Withdraw**

**Deposit USDC:**
- "Deposit 100 USDC to senior"
- "Put 50 dollars in mezzanine"
- "Add 200 USDC to junior tranche"
- "Deposit all my USDC to senior"

**Withdraw:**
- "Withdraw from junior"
- "Take out 50 USDC worth from senior"
- "Withdraw 100 shares from mezzanine"
- "Withdraw all from senior"

### 📊 **Check Balances & Status**

- "What's my balance?"
- "Show my positions"
- "How much do I have in senior?"
- "What's my total portfolio value?"
- "Check my junior tranche balance"
- "Show me my shares"

### 📈 **Epoch Management** (Owner Only)

**Update Epoch with Real Data:**
- "Update epoch with real data"
- "Run epoch with real chain data"
- "Fetch real data and update epoch"

**Update Epoch with Custom Scores:**
- "Update epoch with scores 5000 6000 7000"
- "Run epoch: yield 7000, security 8000, liquidity 6000"
- "Simulate epoch: 4000 5000 6000"

**Epoch Information:**
- "What's the current epoch?"
- "Show me epoch history"
- "What was the last epoch delta?"

### 🎛️ **UI Component Control**

**Show Components:**
- "Show me the multi-chain dashboard"
- "Display cross-chain data"
- "Open the arbitrage detector"
- "Show the epoch panel"
- "Display active chain display"
- "Show loss waterfall visualizer"
- "Open epoch impact visualizer"
- "Show live epoch feed"
- "Display history table"

**Hide Components:**
- "Hide the multi-chain dashboard"
- "Close the epoch panel"
- "Hide arbitrage detector"
- "Close cross-chain analytics"

### ℹ️ **Information & Questions**

- "Explain how tranches work"
- "What's the reserve pool?"
- "How does the vault work?"
- "What's the difference between senior and junior?"
- "Explain the loss waterfall"
- "What are the current share prices?"
- "What's the APY for each tranche?"

### 🔄 **Portfolio Management**

- "Rebalance my portfolio"
- "Move funds to senior"
- "Switch from junior to mezzanine"
- "What's my allocation across tranches?"

---

## 🎯 **Smart Features**

### 1. **Natural Language Understanding**
- Understands variations: "senior", "Senior", "SENIOR"
- Parses amounts: "100 USDC", "50 dollars", "$200"
- Handles partial commands: "deposit 100 to senior" (understands context)

### 2. **Context Awareness**
- Knows your current positions
- Understands your available USDC balance
- Tracks vault state (total value, reserve pool, etc.)
- Remembers conversation history

### 3. **Permission Management**
- Checks if you're the contract owner for epoch updates
- Validates you have sufficient balance for deposits
- Ensures you have shares before withdrawing

### 4. **Error Handling**
- Provides clear error messages
- Suggests fixes when transactions fail
- Explains permission issues

---

## 🖥️ **UI Component Control**

The AI can dynamically show/hide these components:

### **Always Visible (Core Features)**
- ✅ Vault Overview
- ✅ Tranche Cards (Senior, Mezz, Junior)
- ✅ Deposit Panel
- ✅ Withdraw Panel
- ✅ Event History
- ✅ Epoch Impact Visualizer
- ✅ Loss Waterfall Visualizer

### **Hidden by Default (Show on Request)**
- 🔒 Multi-Chain Dashboard
- 🔒 Arbitrage Detector
- 🔒 Active Chain Display
- 🔒 Epoch Panel (Admin Only)
- 🔒 Live Epoch Feed

---

## 📊 **What the AI Can See**

The AI has access to:

1. **Your Portfolio:**
   - Shares in each tranche
   - USDC value in each tranche
   - Current share prices
   - Total portfolio value

2. **Vault State:**
   - Total vault value
   - Reserve pool amount
   - Senior/Mezz/Junior virtual values
   - Current epoch number

3. **Your Resources:**
   - Available USDC balance
   - Contract owner status

4. **Market Data:**
   - Real-time chain data (when requested)
   - Yield, security, and liquidity scores

---

## 🚀 **Example Conversations**

### Example 1: Quick Deposit
```
You: "Deposit 100 USDC to senior"
AI: "I'll deposit 100 USDC to the Senior tranche. This will mint shares based on the current share price."
[Executes transaction]
AI: "✅ Successfully deposited 100 USDC to Senior tranche. Your new balance is..."
```

### Example 2: Check Status
```
You: "What's my balance?"
AI: "Here's your current portfolio:
- Senior: 50 shares, $1,050 value
- Mezzanine: 30 shares, $900 value
- Junior: 20 shares, $600 value
Total: $2,550
Available USDC: $500"
```

### Example 3: Show Dashboard
```
You: "Show me the multi-chain dashboard"
AI: "I'll display the multi-chain dashboard for you."
[Multi-Chain Dashboard appears]
AI: "The multi-chain dashboard is now visible. It shows cross-chain analytics, yield rates, and security metrics."
```

### Example 4: Epoch Update
```
You: "Update epoch with real data"
AI: "I'll fetch real chain data and update the epoch. This may take a moment..."
[Fetches data from DeFiLlama]
AI: "✅ Epoch updated successfully! Global delta: +2.5%. Senior: +0.125%, Mezz: +0.25%, Junior: +0.5%"
```

### Example 5: Complex Request
```
You: "I want to move 50 USDC from junior to senior"
AI: "I'll help you rebalance. First, I'll withdraw 50 USDC worth from Junior, then deposit it to Senior."
[Executes withdraw]
[Executes deposit]
AI: "✅ Rebalancing complete! Moved 50 USDC from Junior to Senior."
```

---

## 🔐 **Security & Permissions**

### **User Actions (Anyone)**
- ✅ Deposit to any tranche
- ✅ Withdraw from own positions
- ✅ Check balances
- ✅ View information
- ✅ Show/hide components

### **Owner-Only Actions**
- 🔒 Update epochs
- 🔒 Access epoch panel
- 🔒 Run epoch simulations

The AI automatically checks permissions and informs you if you don't have access.

---

## 🎨 **UI Features**

### **Dynamic Interface**
- Components appear/disappear based on AI commands
- Clean, uncluttered default view
- Advanced features available on demand

### **Real-Time Updates**
- Portfolio values update automatically
- Share prices reflect epoch changes
- Event history shows latest transactions

### **Visual Feedback**
- Animated value changes
- Color-coded gains/losses
- Real-time epoch impact visualization
- Loss waterfall visualization

---

## 💡 **Tips for Best Experience**

1. **Be Specific:** "Deposit 100 USDC to senior" is clearer than "deposit"
2. **Check First:** Ask "What's my balance?" before withdrawing
3. **Use Real Data:** "Update epoch with real data" for realistic simulations
4. **Explore:** Ask "Show me the multi-chain dashboard" to see advanced features
5. **Ask Questions:** The AI can explain how anything works

---

## 🛠️ **Technical Capabilities**

### **Blockchain Interactions**
- ✅ Read contract state
- ✅ Execute transactions (deposit, withdraw, epoch update)
- ✅ Listen to events
- ✅ Parse transaction results

### **Data Fetching**
- ✅ Real-time chain data (DeFiLlama API)
- ✅ Vault metrics
- ✅ User positions
- ✅ Event history

### **AI Processing**
- ✅ Natural language understanding
- ✅ Context-aware responses
- ✅ Action planning
- ✅ Error recovery

---

## 📝 **What's Next?**

The AI agent is continuously improving. Future capabilities may include:
- Portfolio optimization suggestions
- Risk analysis and recommendations
- Automated rebalancing strategies
- Market trend analysis
- Custom alert triggers

---

**The AI Agent is your primary interface to the Procti vault. Just chat naturally and it will handle the rest!** 🚀

