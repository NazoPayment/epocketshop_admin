import {useNavigate} from 'react-router-dom';
import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import {Link} from '@astryxdesign/core/Link';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';

import PlanCards from '../components/PlanCards.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import InstallButton from '../components/InstallButton.jsx';

/** Public pricing page, reachable before signing in or creating an account. */
export default function Plans() {
  const navigate = useNavigate();

  return (
    <main className="public-page">
      <VStack gap={6}>
        <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
          <HStack gap={2} vAlign="center">
            <img src="/favicon.svg" alt="" width={32} height={32} />
            <Text>ePocketShop</Text>
          </HStack>
          <HStack gap={3} vAlign="center">
            <Link href="/login">Sign in</Link>
            <InstallButton />
            <ThemeToggle />
          </HStack>
        </HStack>

        <VStack gap={1}>
          <Heading level={1}>Plans & billing</Heading>
          <Text type="supporting">Start free, upgrade when your store is ready to grow.</Text>
        </VStack>

        <PlanCards
          renderAction={(p) => (
            <Button
              label={p.tier === 0 ? 'Start free' : `Get ${p.name}`}
              variant={p.highlight ? 'primary' : 'default'}
              onClick={() => navigate('/register')}
            />
          )}
        />

        <Text type="supporting">
          All prices are in South African rand (ZAR). Create your store first, then upgrade any time from Plans & billing.
        </Text>
        <Text type="supporting">
          Already have a store? <Link href="/login">Sign in</Link>
        </Text>
      </VStack>
    </main>
  );
}
