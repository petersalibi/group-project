import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/components/theme-provider';
import { View } from 'react-native';

interface MathProps {
  exp: string;
  block?: boolean; // If true, render as block expression; otherwise, inline
}

// Renders a LaTeX math expression using MathJaxSvg
export default function Math({ exp, block = false }: MathProps) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        marginVertical: block ? 8 : 0,
        width: block ? '100%' : undefined,
        alignItems: block ? 'center' : 'flex-start',
      }}
    >
      <MathJaxSvg
        fontSize={2}
        color={theme === 'light' ? Colors.light.text : Colors.dark.text}
      >{`$$${exp}$$`}</MathJaxSvg>
    </View>
  );
}
