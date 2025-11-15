"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function ConnectWalletButton() {
  return (
    <div className="flex justify-end p-4">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== "loading";
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus || authenticationStatus === "authenticated");

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="px-5 py-2 bg-blue-600 text-white rounded-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="px-5 py-2 bg-red-600 text-white rounded-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Wrong network
                    </button>
                  );
                }

                return (
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="px-4 py-2 bg-gray-100 text-gray-900 rounded-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-500"></div>
                      <span className="text-sm">
                        {account.displayName}
                      </span>
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}

