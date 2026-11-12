import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';

import PageHeader from '../components/PageHeader.jsx';
import PlanCards from '../components/PlanCards.jsx';
import Notice from '../components/Notice.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {businessApi} from '../api/services.js';
import {planName} from '../utils/format.js';

export default function Billing() {
  const {business} = useAuth();
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(null);
  const paid = business.subscription >= 1;

  async function upgrade(planKey) {
    setBusy(planKey);
    const res = await businessApi.createSubscription(String(business.businessId), planKey);
    setBusy('');
    const url = res.ok ? res.data?.payment_link : null;
    if (typeof url === 'string' && /^https:\/\//i.test(url)) {
      window.location.assign(url);
    } else {
      setNotice({
        status: 'error',
        title: 'Unable to start checkout',
        description: res.ok ? 'No payment link was returned.' : res.message,
      });
    }
  }

  async function manage() {
    setBusy('manage');
    const res = await businessApi.manageSubscriptionLink(String(business.businessId));
    setBusy('');
    // The service nests the payment provider's portal link: { data: { data: { link } } }.
    const url = res.ok ? res.data?.data?.data?.link : null;
    if (typeof url === 'string' && /^https:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      setNotice({
        status: 'error',
        title: 'Unable to open the plan manager',
        description:
          res.status === 404
            ? 'No active subscription was found. Choose a plan below to upgrade.'
            : res.ok
              ? 'No link was returned.'
              : res.message,
      });
    }
  }

  return (
    <>
      <PageHeader title="Plans & billing" description="Start free, upgrade when your store is ready to grow." />
      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      <Card>
        <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
          <VStack gap={0}>
            <Text type="supporting">Current plan</Text>
            <Heading level={2}>{planName(business.subscription)}</Heading>
          </VStack>
          {paid ? <Button label="Manage subscription" isLoading={busy === 'manage'} onClick={manage} /> : null}
        </HStack>
      </Card>

      <PlanCards
        currentTier={paid ? 1 : 0}
        renderAction={(p, current) =>
          p.tier === 0 ? null : current ? (
            <Button label="You're on this plan" isDisabled />
          ) : (
            <Button label={`Upgrade to ${p.name}`} variant="primary" isLoading={busy === p.key} onClick={() => upgrade(p.key)} />
          )
        }
      />

      <Text type="supporting">
        All prices are in South African rand (ZAR).
      </Text>
    </>
  );
}
