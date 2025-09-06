import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDetoxcoinsBalance } from '../utils/storage';

interface BalanceContextType {
  balance: number;
  refreshBalance: () => Promise<void>;
  isLoading: boolean;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

interface BalanceProviderProps {
  children: ReactNode;
}

export const BalanceProvider: React.FC<BalanceProviderProps> = ({ children }) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshBalance = async () => {
    try {
      setIsLoading(true);
      const currentBalance = await getDetoxcoinsBalance();
      setBalance(currentBalance);
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshBalance();
  }, []);

  const value: BalanceContextType = {
    balance,
    refreshBalance,
    isLoading,
  };

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = (): BalanceContextType => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};