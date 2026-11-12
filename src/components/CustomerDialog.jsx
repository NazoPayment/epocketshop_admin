import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Divider} from '@astryxdesign/core/Divider';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import {Link} from '@astryxdesign/core/Link';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';

import Notice from './Notice.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {customerApi} from '../api/services.js';
import {formatDate, formatNumber, formatRand} from '../utils/format.js';

function Stat({label, value}) {
  return (
    <VStack gap={0}>
      <Text type="supporting">{label}</Text>
      <Text weight="semibold">{value}</Text>
    </VStack>
  );
}

const waLink = (phone) => `https://wa.me/${String(phone).replace(/[^\d]/g, '')}`;

export default function CustomerDialog({customer, locked, onClose, onChanged}) {
  const {business} = useAuth();
  const [rewards, setRewards] = useState(Array.isArray(customer.rewards) ? customer.rewards : []);
  const [notice, setNotice] = useState(null);
  const [busyKey, setBusyKey] = useState('');

  const name = [customer.name, customer.surname].filter(Boolean).join(' ') || customer.phone_number;

  function mergeReward(updated) {
    if (!updated?.category_name) return;
    setRewards((list) => {
      const idx = list.findIndex((r) => r.category_name === updated.category_name);
      if (idx === -1) return [...list, updated];
      return list.map((r, i) => (i === idx ? {...r, ...updated} : r));
    });
  }

  async function adjust(categoryName, adjustment) {
    setBusyKey(`${categoryName}:adj`);
    const res = await customerApi.adjustRewards(business.businessId, customer.phone_number, {
      productId: 0,
      categoryName,
      adjustment,
    });
    setBusyKey('');
    if (res.ok) {
      mergeReward(res.data?.reward);
      setNotice({status: 'success', title: res.message});
      onChanged();
    } else setNotice({status: 'error', title: 'Could not update stamps', description: res.message});
  }

  async function redeem(categoryName) {
    setBusyKey(`${categoryName}:redeem`);
    const res = await customerApi.redeemRewardCard(business.businessId, customer.phone_number, categoryName);
    setBusyKey('');
    if (res.ok) {
      const updated = Array.isArray(res.data) ? res.data[0] : res.data;
      mergeReward(updated);
      setNotice({status: 'success', title: 'Reward redeemed'});
      onChanged();
    } else setNotice({status: 'error', title: 'Could not redeem the reward', description: res.message});
  }

  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()} width={560} maxHeight="92dvh" purpose="info">
      <DialogHeader title={name} subtitle={customer.email || customer.phone_number} onOpenChange={(open) => !open && onClose()} />
      <VStack gap={4} padding={4} className="dialog-body">
        <Notice notice={notice} onDismiss={() => setNotice(null)} />

        <HStack gap={6} wrap="wrap">
          <Stat label="Orders" value={locked ? '—' : formatNumber(customer.order_count)} />
          <Stat label="Total spent" value={locked ? '—' : formatRand(customer.total_spent)} />
          <Stat label="Average order" value={locked ? '—' : formatRand(customer.average_order_value)} />
          <Stat label="Last order" value={locked ? '—' : formatDate(customer.last_purchase_date)} />
        </HStack>

        <HStack gap={2} wrap="wrap">
          <Button label="Chat on WhatsApp" href={waLink(customer.phone_number)} target="_blank" rel="noopener noreferrer" />
          <Button label="Call" variant="ghost" href={`tel:${customer.phone_number}`} />
        </HStack>

        <Divider />
        <Heading level={3}>Loyalty cards</Heading>
        {locked ? (
          <Text type="supporting">Upgrade your plan to manage loyalty stamps.</Text>
        ) : rewards.length === 0 ? (
          <Text type="supporting">No loyalty progress yet. Set up rewards under Loyalty & rewards.</Text>
        ) : (
          <VStack gap={4}>
            {rewards.map((r) => {
              const category = r.category_name || r.product_name || 'Category';
              const limit = Number(r.reward_product_count) || 10;
              const count = Number(r.number_of_purchases) || 0;
              const ready = count >= limit;
              return (
                <VStack key={category} gap={2}>
                  <HStack hAlign="between">
                    <Text weight="medium">{category}</Text>
                    <Text type="supporting">
                      {count % limit || (ready ? limit : 0)} / {limit} stamps
                    </Text>
                  </HStack>
                  <ProgressBar
                    label={`${category} progress`}
                    isLabelHidden
                    value={ready ? limit : count % limit}
                    max={limit}
                    variant={ready ? 'success' : 'accent'}
                  />
                  <HStack gap={2}>
                    <Button label="Add stamp" size="sm" isLoading={busyKey === `${category}:adj`} onClick={() => adjust(category, 1)} />
                    <Button label="Remove stamp" size="sm" variant="ghost" isDisabled={count <= 0} onClick={() => adjust(category, -1)} />
                    {ready ? (
                      <Button label="Redeem reward" size="sm" variant="primary" isLoading={busyKey === `${category}:redeem`} onClick={() => redeem(category)} />
                    ) : null}
                  </HStack>
                </VStack>
              );
            })}
          </VStack>
        )}
        <Text type="supporting">
          Need to send them their card?{' '}
          <Link href={waLink(customer.phone_number)} isExternalLink>
            Open WhatsApp
          </Link>
        </Text>
      </VStack>
    </Dialog>
  );
}
