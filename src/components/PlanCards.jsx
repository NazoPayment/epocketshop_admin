import {Badge} from '@astryxdesign/core/Badge';
import {Card} from '@astryxdesign/core/Card';
import {Grid} from '@astryxdesign/core/Grid';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {Check} from 'lucide-react';

export const PLANS = [
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

/**
 * Plan comparison cards shared by the signed-in billing page and the public plans page.
 * `currentTier` is the tier the user is on, or null when nobody is signed in.
 * `renderAction(plan, isCurrent)` returns the call to action for each card.
 */
export default function PlanCards({currentTier = null, renderAction}) {
  return (
    <Grid columns={{minWidth: 300}} gap={4}>
      {PLANS.map((p) => {
        const current = currentTier !== null && p.tier === currentTier;
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
              {renderAction ? renderAction(p, current) : null}
            </VStack>
          </Card>
        );
      })}
    </Grid>
  );
}
