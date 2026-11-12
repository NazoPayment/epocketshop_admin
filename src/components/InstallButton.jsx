import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {Download} from 'lucide-react';

import {useInstallPrompt} from '../hooks/useInstallPrompt.js';

/**
 * Visible "Install" button. Android/Chrome/Edge get the native prompt; iPhone/iPad get
 * the Add to Home Screen steps. Hidden once installed or when the browser can't install.
 */
export default function InstallButton({size = 'sm'}) {
  const {canInstall, installed, isIos, install} = useInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (installed || (!canInstall && !isIos)) return null;

  return (
    <>
      <Button
        label="Install"
        size={size}
        variant="secondary"
        icon={<Download size={14} />}
        onClick={canInstall ? install : () => setShowIosHelp(true)}
      />
      {showIosHelp ? (
        <Dialog isOpen onOpenChange={(open) => !open && setShowIosHelp(false)} width={420}>
          <DialogHeader title="Install ePocket Admin" onOpenChange={(open) => !open && setShowIosHelp(false)} />
          <VStack gap={3} padding={4}>
            <Text>1. Open this page in Safari.</Text>
            <Text>2. Tap the Share button at the bottom of the screen.</Text>
            <Text>3. Scroll down and choose Add to Home Screen, then tap Add.</Text>
            <div>
              <Button label="Got it" variant="primary" onClick={() => setShowIosHelp(false)} />
            </div>
          </VStack>
        </Dialog>
      ) : null}
    </>
  );
}
