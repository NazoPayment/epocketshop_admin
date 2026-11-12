import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Grid} from '@astryxdesign/core/Grid';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {useNavigate} from 'react-router-dom';

import PageHeader from '../components/PageHeader.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {AI_AGENT_URL} from '../api/client.js';

const POINTS = [
  {title: 'Built on your catalogue', body: 'The agent works from the same products and stock as your storefront.'},
  {title: 'Tied to your store', body: 'It is set up for your business automatically, so there is nothing to configure.'},
  {title: 'Grows with your plan', body: 'Standard on the Free plan, premium once you upgrade.'},
];

export default function Agent() {
  const {business} = useAuth();
  const navigate = useNavigate();
  const tier = business.subscription >= 1 ? 'premium' : 'standard';
  const src = `${AI_AGENT_URL}/?business_id=${encodeURIComponent(business.businessId)}&tier=${tier}`;

  return (
    <>
      <PageHeader
        title="AI sales agent"
        description="Let your assistant handle customer chats while you run the business."
        actions={<Button label="Open in new tab" href={src} target="_blank" rel="noopener noreferrer" />}
      />

      {tier === 'standard' ? (
        <Banner
          status="info"
          title="You're on the standard agent"
          description="Upgrade for the premium agent with higher limits."
          collapsible={false}
          endContent={<Button label="See plans" size="sm" onClick={() => navigate('/billing')} />}
        />
      ) : null}

      <Grid columns={{minWidth: 240}} gap={4}>
        {POINTS.map((p) => (
          <Card key={p.title}>
            <VStack gap={1}>
              <Heading level={3}>{p.title}</Heading>
              <Text type="supporting">{p.body}</Text>
            </VStack>
          </Card>
        ))}
      </Grid>

      <iframe className="frame" title="AI sales agent" src={src} referrerPolicy="no-referrer" />
      <Text type="supporting">
        If the agent doesn't appear above, your browser may be blocking embedding. Use "Open in new tab" instead.
      </Text>
    </>
  );
}
