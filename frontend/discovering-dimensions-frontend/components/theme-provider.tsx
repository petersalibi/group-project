import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {
    /* default empty */
  },
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemScheme ?? 'light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load stored theme preference
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      } else if (systemScheme) {
        setTheme(systemScheme);
      }
      setIsLoaded(true);
    };
    loadTheme();
  }, [systemScheme]);

  // Persist theme on change
  useEffect(() => {
    if (!isLoaded) return; // Avoid saving before initial load
    console.log('Saving theme:', theme);
    AsyncStorage.setItem('appTheme', theme);
  }, [theme, isLoaded]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Convenient custom hook
export const useTheme = () => useContext(ThemeContext);
