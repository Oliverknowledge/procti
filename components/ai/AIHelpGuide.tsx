"use client";

import { useState } from "react";

/**
 * @component AIHelpGuide
 * @description Comprehensive help guide for new users on how to use the AI assistant
 */
export default function AIHelpGuide() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            ?
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Assistant Guide</h2>
            <p className="text-sm text-gray-600">Learn how to interact with your AI assistant</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 mt-6">
          {/* Quick Start */}
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <button
              onClick={() => toggleSection("quickstart")}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="font-semibold text-gray-900">🚀 Quick Start</h3>
              <span className="text-gray-500">{activeSection === "quickstart" ? "−" : "+"}</span>
            </button>
            {activeSection === "quickstart" && (
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <p>
                  The AI assistant is your primary interface for interacting with the Procti vault system. 
                  Simply type your request in natural language, and the AI will understand and execute it.
                </p>
                <div className="bg-gray-50 rounded p-3 mt-3">
                  <p className="font-medium text-gray-900 mb-2">Try these examples:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>"Show my tranche positions"</li>
                    <li>"Deposit 100 USDC to senior"</li>
                    <li>"What's my balance?"</li>
                    <li>"Show the pools overview"</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* What Can the AI Do */}
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <button
              onClick={() => toggleSection("capabilities")}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="font-semibold text-gray-900">💬 What Can the AI Do?</h3>
              <span className="text-gray-500">{activeSection === "capabilities" ? "−" : "+"}</span>
            </button>
            {activeSection === "capabilities" && (
              <div className="mt-3 space-y-3 text-sm text-gray-700">
                <div>
                  <p className="font-medium text-gray-900 mb-2">💰 Deposits & Withdrawals</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Deposit USDC to tranches (Senior/Mezzanine/Junior)</li>
                    <li>Deposit to SentinelVault</li>
                    <li>Withdraw from your positions</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">📊 View Information</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Check balances and positions</li>
                    <li>View vault statistics</li>
                    <li>See transaction history</li>
                    <li>Check chain information</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">🎛️ Customize Dashboard</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Show/hide components</li>
                    <li>Build your custom view</li>
                    <li>Display only what you need</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">⚙️ Manage System</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Update chain metrics (price, yield, risk)</li>
                    <li>Update oracle price</li>
                    <li>Switch chains</li>
                    <li>Update epochs (owner only)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Example Commands */}
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <button
              onClick={() => toggleSection("examples")}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="font-semibold text-gray-900">📝 Example Commands</h3>
              <span className="text-gray-500">{activeSection === "examples" ? "−" : "+"}</span>
            </button>
            {activeSection === "examples" && (
              <div className="mt-3 space-y-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900 mb-2">Deposits:</p>
                  <div className="bg-gray-50 rounded p-2 space-y-1 text-gray-700 font-mono text-xs">
                    <div>"Deposit 100 USDC to senior"</div>
                    <div>"Put 50 dollars in mezzanine"</div>
                    <div>"Add 200 USDC to junior tranche"</div>
                    <div>"Deposit to sentinel vault"</div>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Withdrawals:</p>
                  <div className="bg-gray-50 rounded p-2 space-y-1 text-gray-700 font-mono text-xs">
                    <div>"Withdraw from junior"</div>
                    <div>"Take out 50 USDC worth from senior"</div>
                    <div>"Withdraw 100 shares from mezzanine"</div>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">View Information:</p>
                  <div className="bg-gray-50 rounded p-2 space-y-1 text-gray-700 font-mono text-xs">
                    <div>"What's my balance?"</div>
                    <div>"Show my positions"</div>
                    <div>"What's the vault overview?"</div>
                    <div>"Show pools overview"</div>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Customize Dashboard:</p>
                  <div className="bg-gray-50 rounded p-2 space-y-1 text-gray-700 font-mono text-xs">
                    <div>"Show tranche positions"</div>
                    <div>"Display deposit panel"</div>
                    <div>"Show multi-chain dashboard"</div>
                    <div>"Hide epoch panel"</div>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">System Management:</p>
                  <div className="bg-gray-50 rounded p-2 space-y-1 text-gray-700 font-mono text-xs">
                    <div>"Update oracle price to 1.00"</div>
                    <div>"Set arc chain price to 0.9987"</div>
                    <div>"Switch to best chain"</div>
                    <div>"Update epoch with real data"</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Available Components */}
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <button
              onClick={() => toggleSection("components")}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="font-semibold text-gray-900">🧩 Available Components</h3>
              <span className="text-gray-500">{activeSection === "components" ? "−" : "+"}</span>
            </button>
            {activeSection === "components" && (
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <p className="mb-3">
                  You can ask the AI to show or hide any of these components to customize your dashboard:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="font-medium text-gray-900">Tranche Vault</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      <li>• Tranche Positions</li>
                      <li>• Deposit Panel</li>
                      <li>• Withdraw Panel</li>
                      <li>• Vault Overview</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="font-medium text-gray-900">Sentinel Vault</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      <li>• Pools Overview</li>
                      <li>• Sentinel Deposit</li>
                      <li>• Mode Indicator</li>
                      <li>• Oracle Price</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="font-medium text-gray-900">Chain Analytics</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      <li>• Multi-Chain Dashboard</li>
                      <li>• Arbitrage Detector</li>
                      <li>• Active Chain Display</li>
                      <li>• Current Chain Info</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="font-medium text-gray-900">Epoch & History</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      <li>• Epoch Panel</li>
                      <li>• Epoch Impact</li>
                      <li>• Loss Waterfall</li>
                      <li>• History Table</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tips & Best Practices */}
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <button
              onClick={() => toggleSection("tips")}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="font-semibold text-gray-900">💡 Tips & Best Practices</h3>
              <span className="text-gray-500">{activeSection === "tips" ? "−" : "+"}</span>
            </button>
            {activeSection === "tips" && (
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="font-medium text-blue-900 mb-2">✅ Do:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Be specific with amounts and tranches</li>
                    <li>Ask questions if you're unsure</li>
                    <li>Use natural language - the AI understands context</li>
                    <li>Start with simple commands to get familiar</li>
                    <li>Customize your dashboard to show only what you need</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                  <p className="font-medium text-yellow-900 mb-2">⚠️ Remember:</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-800">
                    <li>All transactions require wallet approval</li>
                    <li>Epoch updates are owner-only</li>
                    <li>Some features require specific permissions</li>
                    <li>The AI will explain what it's doing before executing</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Getting Started */}
          <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">🎯 Ready to Start?</h3>
            <p className="text-sm text-purple-800 mb-3">
              Try asking the AI assistant one of these to get started:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  // This would trigger the AI with a message - we'll need to pass a callback
                  // For now, just show the suggestion
                }}
                className="w-full text-left bg-white rounded p-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors"
              >
                💬 "Show my tranche positions"
              </button>
              <button
                className="w-full text-left bg-white rounded p-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors"
              >
                💬 "What's my balance?"
              </button>
              <button
                className="w-full text-left bg-white rounded p-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors"
              >
                💬 "Show the pools overview"
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

