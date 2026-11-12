import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {HStack} from '@astryxdesign/core/HStack';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {Download} from 'lucide-react';

import {useInstallPrompt} from '../hooks/useInstallPrompt.js';

/**
 * iOS has no install prompt in any browser, but Safari, Chrome, Edge and Firefox (iOS 16.4+)
 * can all add the app to the Home Screen from their Share menu. Steps differ per browser.
 */
function iosSteps() {
  const ua = window.navigator.userAgent;
  if (/CriOS/i.test(ua)) {
    return [
      'Tap the Share button in the address bar (the square with an arrow, top right).',
      'Scroll down and choose Add to Home Screen.',
      'Tap Add.',
    ];
  }
  if (/EdgiOS/i.test(ua)) {
    return ['Tap the Share button in the address bar.', 'Choose Add to Home Screen.', 'Tap Add.'];
  }
  if (/FxiOS/i.test(ua)) {
    return ['Tap the menu button (three lines).', 'Tap Share, then choose Add to Home Screen.', 'Tap Add.'];
  }
  return [
    'Tap the Share button at the bottom of the screen (the square with an arrow).',
    'Scroll down and choose Add to Home Screen.',
    'Tap Add.',
  ];
}

/**
 * "Install" control. Android/Chrome/Edge desktop get the native prompt; iPhone/iPad get the
 * Add to Home Screen steps for their browser. Hidden once installed or when installing isn't possible.
 * `compact` renders an icon-only button for tight spaces like the top bar.
 */
export default function InstallButton({compact = false}) {
  const {canInstall, installed, isIos, install} = useInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (installed || (!canInstall && !isIos)) return null;

  const onPress = canInstall ? install : () => setShowIosHelp(true);
  const close = () => setShowIosHelp(false);

  return (
    <>
      {compact ? (
        <IconButton
          label="Install app"
          tooltip="Install app"
          variant="ghost"
          size="sm"
          icon={<Download size={16} />}
          onClick={onPress}
        />
      ) : (
        <Button label="Install" size="sm" variant="secondary" icon={<Download size={14} />} onClick={onPress} />
      )}
      {showIosHelp ? (
        <Dialog isOpen onOpenChange={(open) => !open && close()} width={420}>
          <DialogHeader title="Add ePocket Admin to your Home Screen" onOpenChange={(open) => !open && close()} />
          <VStack gap={3} padding={4} as="ol">
            {iosSteps().map((step, i) => (
              <HStack key={step} as="li" gap={2} vAlign="start">
                <Text weight="semibold">{i + 1}.</Text>
                <Text>{step}</Text>
              </HStack>
            ))}
          </VStack>
          <VStack gap={3} padding={4}>
            <Text type="supporting">
              Don't see Add to Home Screen? Update iOS to 16.4 or later, or open this page in Safari.
            </Text>
            <div>
              <Button label="Got it" variant="primary" onClick={close} />
            </div>
          </VStack>
        </Dialog>
      ) : null}
    </>
  );
}
