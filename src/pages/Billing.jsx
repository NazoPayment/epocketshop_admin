import {useState} from 'react';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Grid} from '@astryxdesign/core/Grid';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {Check} from 'lucide-react';

import PageHeader from '../components/PageHeader.jsx';
import Notice from '../components/Notice.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {businessApi} from '../api/services.js';
import {planName} from '../utils/format.js';

const PLANS = [
  {
    key: 'free',
    tier: 0,
    name: 'Free',
    price: 'R0',
    cadence: 'to start',
    blurb: 'Everything you need to open your store.',
    features: ['Your own storefront link', 'Orders from every channel in one list', 'Up to 5 products', 'Standard AI sales agent', '10% transaction fee'],
  },
  {
    key: 'pusha_phanda_pressa_plan',
    tier: 1,
    name: 'Pusha Phanda Pressa',
    price: 'R250',
    cadence: 'per month',
    blurb: 'For sellers ready to scale.',
    features: ['Unlimited products', 'Business insights and analytics', 'Full customer details and loyalty', 'Premium AI sales agent', '5% transaction fee'],
    highlight: true,
  },
];

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

      <Grid columns={{minWidth: 300}} gap={4}>
        {PLANS.map((p) => {
          const current = p.tier === 0 ? !paid : paid;
          return (
            <Card key={p.key} variant={p.highlight ? 'green' : 'default'}>
              <VStack gap={4}>
                <HStack hAlign="between" vAlign="center">
                  <Heading level={3}>{p.name}</Heading>
                  {current ? <Badge variant="success" label="Current" /> : p.highlight ? <Badge variant="info" label="Most popular" /> : null}
                </HStack>
                <HStack gap={1} vAlign="end">
                  <Heading level={1}>{p.price}</Heading>
                  <Text type="supporting">{p.cadence}</Text>
                </HStack>
                <Text type="supporting">{p.blurb}</Text>
                <VStack gap={2} as="ul">
                  {p.features.map((f) => (
                    <HStack key={f} gap={2} vAlign="center" as="li">
                      <Check size={16} aria-hidden="true" />
                      <Text>{f}</Text>
                    </HStack>
                  ))}
                </VStack>
                {p.tier === 0 ? null : current ? (
                  <Button label="You're on this plan" isDisabled />
                ) : (
                  <Button label={`Upgrade to ${p.name}`} variant="primary" isLoading={busy === p.key} onClick={() => upgrade(p.key)} />
                )}
              </VStack>
            </Card>
          );
        })}
      </Grid>

      <Text type="supporting">
        All prices are in South African rand (ZAR).
      </Text>
    </>
  );
}
