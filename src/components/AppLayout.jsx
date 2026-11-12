import {useEffect, useState} from 'react';
import {Outlet, useLocation} from 'react-router-dom';
import {IconButton} from '@astryxdesign/core/IconButton';
import {AppShell} from '@astryxdesign/core/AppShell';
import {SideNav, SideNavHeading, SideNavItem, SideNavSection} from '@astryxdesign/core/SideNav';
import {TopNav} from '@astryxdesign/core/TopNav';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {HStack} from '@astryxdesign/core/HStack';
import {
  BadgeCheck,
  Bot,
  ChartNoAxesCombined,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Package,
  Receipt,
  Search,
  Settings,
  Store,
  Users,
} from 'lucide-react';

import NotificationsBell from './NotificationsBell.jsx';
import SearchDialog from './SearchDialog.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import InstallButton from './InstallButton.jsx';
import {AlertsProvider} from '../context/AlertsContext.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {planName} from '../utils/format.js';

const NAV = [
  {
    title: 'Overview',
    items: [
      {label: 'Dashboard', to: '/', icon: LayoutDashboard},
      {label: 'Orders', to: '/orders', icon: Receipt},
      {label: 'Products', to: '/products', icon: Package},
    ],
  },
  {
    title: 'Sell everywhere',
    items: [
      {label: 'Sales channels', to: '/channels', icon: Store},
      {label: 'AI sales agent', to: '/agent', icon: Bot},
    ],
  },
  {
    title: 'Grow',
    items: [
      {label: 'Customers', to: '/customers', icon: Users},
      {label: 'Loyalty & rewards', to: '/loyalty', icon: Megaphone},
      {label: 'Analytics', to: '/analytics', icon: ChartNoAxesCombined},
    ],
  },
  {
    title: 'Business',
    items: [
      {label: 'Verification', to: '/verification', icon: BadgeCheck},
      {label: 'Plans & billing', to: '/billing', icon: CreditCard},
      {label: 'Settings', to: '/settings', icon: Settings},
    ],
  },
];

function isActive(pathname, to) {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);
}

export default function AppLayout() {
  return (
    <AlertsProvider>
      <Shell />
    </AlertsProvider>
  );
}

function Shell() {
  const {business, vendor, logout} = useAuth();
  const {pathname} = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  // Ctrl/Cmd+K opens search from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const displayName = business?.businessName || 'Your store';
  const ownerName = [vendor?.name, vendor?.surname].filter(Boolean).join(' ');

  const sideNav = (
    <SideNav
      aria-label="Main navigation"
      collapsible
      header={
        <SideNavHeading
          heading="ePocketShop"
          subheading="Admin"
          icon={<img src="/favicon.svg" alt="" width={28} height={28} />}
        />
      }
    >
      {NAV.map((section) => (
        <SideNavSection key={section.title} title={section.title}>
          {section.items.map((item) => (
            <SideNavItem
              key={item.to}
              label={item.label}
              href={item.to}
              icon={item.icon}
              isSelected={isActive(pathname, item.to)}
            />
          ))}
        </SideNavSection>
      ))}
    </SideNav>
  );

  const topNav = (
    <TopNav
      label="Account"
      heading={
        <HStack gap={2} vAlign="center">
          <Avatar name={displayName} src={business?.logoUrl || undefined} size="sm" />
          <strong className="truncate">{displayName}</strong>
        </HStack>
      }
      endContent={
        <HStack gap={2} vAlign="center">
          <span className="hide-on-mobile">
            <Badge
              variant={business?.subscription ? 'success' : 'neutral'}
              label={`${planName(business?.subscription)} plan`}
            />
          </span>
          <IconButton
            label="Search (Ctrl+K)"
            tooltip="Search (Ctrl+K)"
            variant="ghost"
            size="sm"
            icon={<Search size={16} />}
            onClick={() => setSearchOpen(true)}
          />
          <InstallButton compact />
          <NotificationsBell />
          <ThemeToggle />
          {ownerName ? <span className="hide-on-mobile">{ownerName}</span> : null}
          <Button label="Sign out" variant="ghost" size="sm" onClick={logout} />
        </HStack>
      }
    />
  );

  return (
    <AppShell sideNav={sideNav} topNav={topNav} contentPadding={0} variant="elevated">
      <div className="page">
        <Outlet />
      </div>
      <SearchDialog isOpen={searchOpen} onOpenChange={setSearchOpen} />
    </AppShell>
  );
}
