import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button} from '@astryxdesign/core/Button';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Divider} from '@astryxdesign/core/Divider';
import {HStack} from '@astryxdesign/core/HStack';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {Bell, CircleAlert, PackageX, ReceiptText} from 'lucide-react';

import {useAlerts} from '../context/AlertsContext.jsx';

const ICONS = {order: ReceiptText, unpaid: CircleAlert, stock: PackageX};

export default function NotificationsBell() {
  const {alerts, markOrdersSeen, permission, enableDesktopAlerts} = useAlerts();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const count = alerts.length;

  function toggle(next) {
    setOpen(next);
    // Opening the panel counts as having seen the new orders.
    if (!next) markOrdersSeen();
  }

  function go(to) {
    markOrdersSeen();
    setOpen(false);
    navigate(to);
  }

  return (
    <>
      <span className="bell-wrap">
        <IconButton
          label={count ? `Notifications, ${count} new` : 'Notifications'}
          tooltip="Notifications"
          variant="ghost"
          size="sm"
          icon={<Bell size={16} />}
          onClick={() => toggle(true)}
        />
        {count > 0 ? (
          <span className="bell-count" aria-hidden="true">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </span>

      <Dialog isOpen={open} onOpenChange={toggle} width={440} maxHeight="85dvh" purpose="info">
        <DialogHeader title="Notifications" subtitle="Orders and stock that need your attention" onOpenChange={toggle} />
        <VStack gap={0} className="dialog-body">
          {count === 0 ? (
            <VStack gap={1} padding={4}>
              <Text weight="semibold">You're all caught up</Text>
              <Text type="supporting">New orders, unpaid orders and low stock will show up here.</Text>
            </VStack>
          ) : (
            alerts.map((a, i) => {
              const Icon = ICONS[a.kind] || Bell;
              return (
                <div key={a.id}>
                  {i > 0 ? <Divider /> : null}
                  <HStack gap={3} vAlign="start" padding={4}>
                    <Icon size={18} aria-hidden="true" />
                    <VStack gap={0.5}>
                      <Text weight="semibold">{a.title}</Text>
                      <Text type="supporting">{a.body}</Text>
                      <div>
                        <Button label="View" size="sm" variant="ghost" onClick={() => go(a.to)} />
                      </div>
                    </VStack>
                  </HStack>
                </div>
              );
            })
          )}
          {permission === 'default' ? (
            <VStack gap={2} padding={4}>
              <Divider />
              <Text type="supporting">Get a desktop alert when a new order arrives while this tab is in the background.</Text>
              <div>
                <Button label="Enable desktop alerts" size="sm" onClick={enableDesktopAlerts} />
              </div>
            </VStack>
          ) : null}
        </VStack>
      </Dialog>
    </>
  );
}
