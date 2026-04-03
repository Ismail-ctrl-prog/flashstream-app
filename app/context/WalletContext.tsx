"use client";

import { createContext, useContext, ReactNode, useEffect } from "react";
import { useWallet as useAptosWallet, AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

interface WalletContextType {
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  signAndSubmit: (payload: any) => Promise<any>;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  connect: async () => {},
  disconnect: () => {},
  isConnecting: false,
  signAndSubmit: async () => {},
});

function WalletContextInner({ children }: { children: ReactNode }) {
  const { connect, disconnect, account, isLoading, signAndSubmitTransaction, connected } = useAptosWallet();

  useEffect(() => {
    if (connected && account?.address) {
      sessionStorage.setItem("walletAddress", account.address.toString());
    } else {
      sessionStorage.removeItem("walletAddress");
    }
  }, [connected, account]);

  const handleConnect = async () => {
    await connect("Petra");
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem("walletAddress");
    disconnect();
  };

  return (
    <WalletContext.Provider value={{
      address: account?.address?.toString() ?? null,
      connect: handleConnect,
      disconnect: handleDisconnect,
      isConnecting: isLoading,
      signAndSubmit: signAndSubmitTransaction,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      optInWallets={["Petra"]}
      dappConfig={{ network: Network.TESTNET, aptosConnect: { dappName: "FlashStream" } }}
    >
      <WalletContextInner>{children}</WalletContextInner>
    </AptosWalletAdapterProvider>
  );
}

export const useWallet = () => useContext(WalletContext);
