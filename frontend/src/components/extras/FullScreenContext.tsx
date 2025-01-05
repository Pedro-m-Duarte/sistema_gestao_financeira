// src/components/extras/FullScreenContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface FullScreenContextProps {
  isFullScreen: boolean;
  setIsFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
}

const FullScreenContext = createContext<FullScreenContextProps | undefined>(undefined);

export const useFullScreen = () => {
  const context = useContext(FullScreenContext);
  if (!context) {
    throw new Error('useFullScreen must be used within a FullScreenProvider');
  }
  return context;
};

interface FullScreenProviderProps {
  children: ReactNode; // Tipando a prop children como ReactNode
}

export const FullScreenProvider: React.FC<FullScreenProviderProps> = ({ children }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const docBody = document.querySelector('body');
    
    if (isFullScreen) {
      docBody?.requestFullscreen();
    } else if (document.fullscreen) {
      document.exitFullscreen();
    }
  }, [isFullScreen]);

  return (
    <FullScreenContext.Provider value={{ isFullScreen, setIsFullScreen }}>
      {children}
    </FullScreenContext.Provider>
  );
};