import {IconButton} from '@astryxdesign/core/IconButton';
import {Moon, Sun} from 'lucide-react';

import {useThemeMode} from '../context/ThemeModeContext.jsx';

/** Quick light/dark switch. "System" is available under Settings > Account. */
export default function ThemeToggle({size = 'sm'}) {
  const {mode, setMode} = useThemeMode();
  const prefersDark =
    mode === 'dark' || (mode === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const label = prefersDark ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <IconButton
      label={label}
      tooltip={label}
      variant="ghost"
      size={size}
      icon={prefersDark ? <Sun size={16} /> : <Moon size={16} />}
      onClick={() => setMode(prefersDark ? 'light' : 'dark')}
    />
  );
}
