import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Button} from '@astryxdesign/core/Button';
import {HStack} from '@astryxdesign/core/HStack';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';

export default function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  isDestructive = false,
  onConfirm,
}) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="required" width={440}>
      <DialogHeader title={title} onOpenChange={onOpenChange} />
      <VStack gap={4} padding={4}>
        <Text>{description}</Text>
        <HStack gap={2} hAlign="end">
          <Button label="Cancel" variant="ghost" onClick={() => onOpenChange(false)} />
          <Button
            label={confirmLabel}
            variant={isDestructive ? 'destructive' : 'primary'}
            clickAction={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
          />
        </HStack>
      </VStack>
    </Dialog>
  );
}
