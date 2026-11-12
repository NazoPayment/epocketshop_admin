import {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Dialog} from '@astryxdesign/core/Dialog';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {VStack} from '@astryxdesign/core/VStack';

import {useAlerts} from '../context/AlertsContext.jsx';
import {formatCents, formatRand} from '../utils/format.js';

const PAGES = [
  {label: 'Dashboard', to: '/', hint: 'Page'},
  {label: 'Orders', to: '/orders', hint: 'Page'},
  {label: 'Products', to: '/products', hint: 'Page'},
  {label: 'Sales channels', to: '/channels', hint: 'Page'},
  {label: 'AI sales agent', to: '/agent', hint: 'Page'},
  {label: 'Customers', to: '/customers', hint: 'Page'},
  {label: 'Loyalty & rewards', to: '/loyalty', hint: 'Page'},
  {label: 'Analytics', to: '/analytics', hint: 'Page'},
  {label: 'Verification', to: '/verification', hint: 'Page'},
  {label: 'Plans & billing', to: '/billing', hint: 'Page'},
  {label: 'Settings', to: '/settings', hint: 'Page'},
  {label: 'Add a product', to: '/products?new=1', hint: 'Action'},
];

const MAX_RESULTS = 12;

/** Ctrl/Cmd+K search across pages, quick actions, recent orders and products. */
export default function SearchDialog({isOpen, onOpenChange}) {
  const navigate = useNavigate();
  const {invoices, products} = useAlerts();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActive(0);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = [
      ...PAGES.map((p) => ({...p, key: `page-${p.to}`})),
      ...invoices.map((o) => ({
        key: `order-${o.number}`,
        label: `Order #${o.number}`,
        hint: `${o.status} · ${formatRand(o.total)}${o.phone ? ` · ${o.phone}` : ''}`,
        to: `/orders?q=${o.number}`,
        haystack: `order ${o.number} ${o.phone} ${o.status} ${o.note}`,
      })),
      ...products.map((p) => ({
        key: `product-${p.id}`,
        label: p.name,
        hint: `Product · ${formatCents(p.price)}${p.category ? ` · ${p.category}` : ''}`,
        to: `/products?q=${encodeURIComponent(p.name)}`,
        haystack: `${p.name} ${p.category} ${p.description}`,
      })),
    ];
    const matches = q
      ? items.filter((i) => `${i.label} ${i.haystack || ''}`.toLowerCase().includes(q))
      : items.filter((i) => i.hint === 'Page' || i.hint === 'Action');
    return matches.slice(0, MAX_RESULTS);
  }, [query, invoices, products]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({block: 'nearest'});
  }, [active]);

  function choose(item) {
    onOpenChange(false);
    navigate(item.to);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      choose(results[active]);
    }
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={560} maxHeight="80dvh" purpose="info" padding={0}>
      <VStack gap={3} padding={4}>
        <TextInput
          label="Search"
          isLabelHidden
          placeholder="Search orders, products, pages…"
          startIcon="search"
          value={query}
          onChange={setQuery}
          onKeyDown={onKeyDown}
          hasAutoFocus
          autoComplete="off"
        />
        <div ref={listRef} role="listbox" aria-label="Search results" className="search-list">
          {results.length === 0 ? (
            <Text type="supporting">No matches for "{query}".</Text>
          ) : (
            results.map((r, i) => (
              <button
                key={r.key}
                type="button"
                role="option"
                aria-selected={i === active}
                className="search-item"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(r)}
              >
                <span className="search-label">{r.label}</span>
                <span className="search-hint">{r.hint}</span>
              </button>
            ))
          )}
        </div>
        <Text type="supporting">Use ↑ ↓ to move and Enter to open.</Text>
      </VStack>
    </Dialog>
  );
}
