import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';

import ThemeToggle from './ThemeToggle.jsx';

const CHANNELS = ['Storefront', 'WhatsApp', 'Instagram', 'Point of sale'];
const POINTS = [
  'One order book for every channel',
  'Stock updates itself when you sell',
  'Payments and delivery in the same flow',
  'An AI sales agent that helps with customer chats',
];

export default function AuthLayout({title, subtitle, children}) {
  return (
    <div className="auth-layout">
      <aside className="auth-hero" aria-label="About ePocketShop">
        <div>
          <img src="/favicon.svg" alt="" width={44} height={44} />
        </div>
        <div>
          <h2>Sell anywhere. It all lands in one place.</h2>
          <p>
            Run your storefront, WhatsApp, Instagram and till from one system, with the same
            stock, payments and orders behind every sale.
          </p>
        </div>
        <ul>
          {POINTS.map((p) => (
            <li key={p}>
              <span className="dot" aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
        <div className="chips" aria-hidden="true">
          {CHANNELS.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
        </div>
      </aside>
      <main className="auth-panel">
        <div className="auth-theme-toggle">
          <ThemeToggle />
        </div>
        <div className="auth-card">
          <VStack gap={6}>
            <VStack gap={1}>
              <Heading level={1}>{title}</Heading>
              {subtitle ? <Text type="supporting">{subtitle}</Text> : null}
            </VStack>
            {children}
          </VStack>
        </div>
      </main>
    </div>
  );
}
