"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConversationalAgent } from "@/hooks/useConversationalAgent";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import AIHelpGuide from "@/components/ai/AIHelpGuide";

/**
 * @component ConversationalAgent
 * @description Primary interface for blockchain interactions through AI conversation
 * @notice Users interact with blockchain through natural language chat
 */
interface ConversationalAgentProps {
  onComponentAction?: (action: "show" | "hide", component: string) => void;
}

export default function ConversationalAgent({ onComponentAction }: ConversationalAgentProps) {
  const { isConnected } = useAccount();
  const { messages, processMessage, isProcessing, error, clearMessages, componentActions, clearComponentActions } = useConversationalAgent();
  const [input, setInput] = useState("");
  const [showHelp, setShowHelp] = useState(true); // Show help by default for new users
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const hasApiKey = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  const scrollToBottom = () => {
    // Only scroll within the messages container, not the entire page
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Check if user is near the bottom (within 100px) before auto-scrolling
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isNearBottom || messages.length <= 2) {
        // Smooth scroll within container only
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle component visibility actions from AI
  useEffect(() => {
    if (componentActions.length > 0 && onComponentAction) {
      componentActions.forEach(({ action, component }) => {
        onComponentAction(action, component);
      });
      clearComponentActions();
    }
  }, [componentActions, onComponentAction, clearComponentActions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const message = input.trim();
    setInput("");
    await processMessage(message);
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Connect your wallet to start using the AI assistant</p>
          <ConnectWalletButton />
        </div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ API Key Required</h3>
        <p className="text-sm text-yellow-800">
          Add <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_OPENAI_API_KEY</code> to your <code className="bg-yellow-100 px-1 rounded">.env</code> file to enable the AI assistant.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border-2 border-purple-200 shadow-lg flex flex-col" style={{ height: "750px" }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Assistant</h3>
              <p className="text-xs text-purple-100">Interact with the blockchain through conversation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
              title="Toggle help guide"
            >
              {showHelp ? "📖 Hide Help" : "📖 Show Help"}
            </button>
            <button
              onClick={clearMessages}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Help Guide */}
      {showHelp && (
        <div className="border-b border-gray-200 p-4 bg-white max-h-96 overflow-y-auto">
          <AIHelpGuide />
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "bg-[#8B5CF6] text-white"
                  : "bg-white border border-gray-200 text-gray-900"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.timestamp && (
                <p className={`text-xs mt-1 ${msg.role === "user" ? "text-purple-100" : "text-gray-500"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B5CF6]"></div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        {error && (
          <div className="mb-2 bg-red-50 border border-red-200 rounded-lg p-2">
            <p className="text-xs text-red-800">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message... (e.g., 'deposit 100 USDC to senior', 'withdraw from junior', 'what's my balance?')"
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-6 py-2 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? "..." : "Send"}
          </button>
        </form>
            <p className="text-xs text-gray-500 mt-2">
              💡 Try: "show pools overview", "switch to best chain", "set optimism yield to 7%", "change arbitrum risk to 30", "display oracle price", "show my tranche positions", "add deposit panel", "update base price to 1.01"
            </p>
      </div>
    </div>
  );
}

