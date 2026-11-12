import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {CheckboxInput} from '@astryxdesign/core/CheckboxInput';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {HStack} from '@astryxdesign/core/HStack';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Selector} from '@astryxdesign/core/Selector';
import {Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow} from '@astryxdesign/core/Table';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {VStack} from '@astryxdesign/core/VStack';
import {Download, Pause, Pencil, Play, Plus, Trash2, Upload} from 'lucide-react';

import PageHeader from '../components/PageHeader.jsx';
import ProductDialog from '../components/ProductDialog.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Notice from '../components/Notice.jsx';
import Loading from '../components/Loading.jsx';
import StatCard from '../components/StatCard.jsx';
import MobileCardList from '../components/MobileCardList.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {productApi} from '../api/services.js';
import {formatCents, formatNumber} from '../utils/format.js';
import {parseCsvObjects, parseMoney} from '../utils/csv.js';
import {downloadText, toCsv} from '../utils/orders.js';
import {LOW_STOCK} from '../utils/constants.js';

const MAX_IMPORT_ROWS = 200;

export default function Products() {
  const {business} = useAuth();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState('all');
  const [editing, setEditing] = useState(params.get('new') ? {} : null); // product | {} for new | null
  const [deleting, setDeleting] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkDelete, setBulkDelete] = useState(false);
  const [busy, setBusy] = useState('');
  const fileRef = useRef(null);

  // Search links open this page with ?q= / ?new=1; clear them once consumed.
  useEffect(() => {
    if (params.get('q') || params.get('new')) setParams({}, {replace: true});
  }, [params, setParams]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await productApi.list(business.businessName);
    if (res.ok) {
      setProducts(Array.isArray(res.data?.products) ? res.data.products : []);
      setNotice(null);
    } else {
      setProducts([]);
      setNotice({status: 'error', title: 'Could not load products', description: res.message});
    }
    setSelected(new Set());
    setLoading(false);
  }, [business.businessName]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (!q || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q)),
    );
  }, [products, query, category]);

  const stats = useMemo(
    () => ({
      total: products.length,
      live: products.filter((p) => !p.is_paused).length,
      low: products.filter((p) => Number(p.available_stock) <= LOW_STOCK).length,
    }),
    [products],
  );

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someSelected = filtered.some((p) => selected.has(p.id));

  function toggleOne(id, on) {
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(on) {
    setSelected(on ? new Set(filtered.map((p) => p.id)) : new Set());
  }

  const updatePayload = (p, isPaused) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price,
    available_stock: p.available_stock,
    business_name: business.businessName,
    business_id: business.businessId,
    vendor_id: business.vendorId,
    extras: (p.extras || []).map((x) => ({name: x.name, add: true, price: x.price})),
    options: (p.options || []).map((x) => ({option: x.option, price: x.price})),
    is_paused: isPaused,
  });

  async function setPaused(p, isPaused) {
    const res = await productApi.update(updatePayload(p, isPaused));
    if (res.ok) {
      setProducts((list) => list.map((x) => (x.id === p.id ? {...x, is_paused: isPaused} : x)));
      return true;
    }
    return false;
  }

  async function togglePause(p) {
    const ok = await setPaused(p, !p.is_paused);
    if (!ok) setNotice({status: 'error', title: 'Could not update the product'});
  }

  async function remove(p) {
    const res = await productApi.remove(p.id);
    if (res.ok) {
      setProducts((list) => list.filter((x) => x.id !== p.id));
      setNotice({status: 'success', title: `Deleted ${p.name}`});
    } else {
      setNotice({status: 'error', title: 'Could not delete the product', description: res.message});
    }
  }

  /** Runs one request per selected product, one after another, and reports how many succeeded. */
  async function bulk(kind) {
    const targets = products.filter((p) => selected.has(p.id));
    setBusy(kind);
    let done = 0;
    for (const p of targets) {
      let ok;
      if (kind === 'delete') {
        // eslint-disable-next-line no-await-in-loop
        ok = (await productApi.remove(p.id)).ok;
        if (ok) setProducts((list) => list.filter((x) => x.id !== p.id));
      } else {
        // eslint-disable-next-line no-await-in-loop
        ok = await setPaused(p, kind === 'pause');
      }
      if (ok) done += 1;
    }
    setBusy('');
    setSelected(new Set());
    const verb = {pause: 'Paused', resume: 'Resumed', delete: 'Deleted'}[kind];
    setNotice({
      status: done === targets.length ? 'success' : 'warning',
      title: `${verb} ${done} of ${targets.length} products`,
      description: done === targets.length ? undefined : 'Some requests failed. Reload and try the rest again.',
    });
  }

  function exportCsv() {
    const rows = (selected.size ? products.filter((p) => selected.has(p.id)) : filtered);
    downloadText(
      'products.csv',
      toCsv(rows, [
        {header: 'name', value: (p) => p.name},
        {header: 'description', value: (p) => p.description},
        {header: 'category', value: (p) => p.category},
        {header: 'price', value: (p) => (Number(p.price) / 100).toFixed(2)},
        {header: 'stock', value: (p) => p.available_stock},
        {header: 'paused', value: (p) => (p.is_paused ? 'yes' : 'no')},
      ]),
    );
  }

  async function importCsv(file) {
    if (!file) return;
    setBusy('import');
    try {
      const rows = parseCsvObjects(await file.text());
      if (rows.length === 0) throw new Error('empty');
      if (rows.length > MAX_IMPORT_ROWS) {
        setNotice({status: 'error', title: `Import up to ${MAX_IMPORT_ROWS} products at a time.`});
        return;
      }
      let created = 0;
      const skipped = [];
      for (const [i, r] of rows.entries()) {
        const price = parseMoney(r.price);
        if (!r.name || !(price > 0)) {
          skipped.push(i + 2);
          // eslint-disable-next-line no-continue
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        const res = await productApi.create({
          name: r.name,
          description: r.description || '',
          category: r.category || '',
          price: Math.round(price * 100),
          available_stock: Number.parseInt(r.stock, 10) || 0,
          business_name: business.businessName,
          business_id: business.businessId,
          vendor_id: business.vendorId,
          extras: [],
          options: [],
          is_paused: /^(yes|true|1)$/i.test(r.paused || ''),
          variant: '',
          extra_for: null,
          reward_product: false,
          last_update: Math.floor(Date.now() / 1000),
          sku: null,
          image: null,
        });
        if (res.ok) created += 1;
        else skipped.push(i + 2);
      }
      // Reload first: load() clears the notice, so set the result message afterwards.
      await load();
      setNotice({
        status: skipped.length ? 'warning' : 'success',
        title: `Imported ${created} of ${rows.length} products`,
        description: skipped.length ? `Skipped CSV rows: ${skipped.slice(0, 15).join(', ')}${skipped.length > 15 ? '…' : ''}. Each row needs a name and a price.` : undefined,
      });
    } catch {
      setNotice({
        status: 'error',
        title: "Couldn't read that file",
        description: 'Use a CSV with the columns: name, description, category, price, stock.',
      });
    } finally {
      setBusy('');
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="One catalogue powers your storefront, WhatsApp and every other channel."
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => importCsv(e.target.files?.[0])}
            />
            <Button
              label="Import CSV"
              icon={<Upload size={16} />}
              isLoading={busy === 'import'}
              onClick={() => fileRef.current?.click()}
            />
            <Button label="Export CSV" icon={<Download size={16} />} isDisabled={products.length === 0} onClick={exportCsv} />
            <Button label="Add product" variant="primary" icon={<Plus size={16} />} onClick={() => setEditing({})} />
          </>
        }
      />

      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      <section className="stat-grid" aria-label="Catalogue summary">
        <StatCard label="Products" value={formatNumber(stats.total)} isLoading={loading} />
        <StatCard label="Live on your store" value={formatNumber(stats.live)} isLoading={loading} />
        <StatCard label={`Low stock (≤ ${LOW_STOCK})`} value={formatNumber(stats.low)} isLoading={loading} />
      </section>

      <div className="toolbar">
        <div className="grow">
          <TextInput label="Search" placeholder="Name, description or category" startIcon="search" hasClear value={query} onChange={setQuery} />
        </div>
        <Selector
          label="Category"
          value={category}
          onChange={setCategory}
          options={[{value: 'all', label: 'All categories'}, ...categories.map((c) => ({value: c, label: c}))]}
          width={220}
        />
      </div>

      {selected.size > 0 ? (
        <HStack gap={2} vAlign="center" wrap="wrap" className="bulk-bar" role="region" aria-label="Bulk actions">
          <Text weight="semibold">{selected.size} selected</Text>
          <Button label="Pause" size="sm" icon={<Pause size={14} />} isLoading={busy === 'pause'} onClick={() => bulk('pause')} />
          <Button label="Resume" size="sm" icon={<Play size={14} />} isLoading={busy === 'resume'} onClick={() => bulk('resume')} />
          <Button label="Delete" size="sm" variant="destructive" icon={<Trash2 size={14} />} isLoading={busy === 'delete'} onClick={() => setBulkDelete(true)} />
          <Button label="Clear" size="sm" variant="ghost" onClick={() => setSelected(new Set())} />
        </HStack>
      ) : null}

      {loading ? (
        <Loading label="Loading products" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={products.length === 0 ? 'Add your first product' : 'No products match'}
          description={
            products.length === 0
              ? 'Upload photos, set prices and stock, or import many at once from a CSV.'
              : 'Try a different search or category.'
          }
          actions={products.length === 0 ? <Button label="Add product" variant="primary" onClick={() => setEditing({})} /> : null}
        />
      ) : (
        <>
        <MobileCardList
          label="Products"
          items={filtered.map((p) => {
            const stock = Number(p.available_stock);
            return {
              key: p.id,
              title: p.name,
              subtitle: [p.category, stock <= 0 ? 'Out of stock' : `${stock} in stock`].filter(Boolean).join(' · '),
              media: <Avatar src={p.image || undefined} name={p.name} shape="rounded" size="lg" tooltip={false} />,
              value: formatCents(p.price),
              badge: <Badge variant={p.is_paused ? 'neutral' : 'success'} label={p.is_paused ? 'Paused' : 'Live'} />,
              actionLabel: `Edit ${p.name}`,
              onClick: () => setEditing(p),
              actions: (
                <>
                  <CheckboxInput
                    label="Select"
                    value={selected.has(p.id)}
                    onChange={(on) => toggleOne(p.id, Boolean(on))}
                  />
                  <HStack gap={1}>
                    <Button
                      label={p.is_paused ? 'Resume' : 'Pause'}
                      size="sm"
                      variant="ghost"
                      icon={p.is_paused ? <Play size={14} /> : <Pause size={14} />}
                      onClick={() => togglePause(p)}
                    />
                    <Button label="Delete" size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setDeleting(p)} />
                  </HStack>
                </>
              ),
            };
          })}
        />
        <div className="table-wrap desktop-only">
          <Table hasHover idKey="id">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>
                  <CheckboxInput
                    label="Select all products"
                    isLabelHidden
                    value={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onChange={(on) => toggleAll(Boolean(on))}
                  />
                </TableHeaderCell>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Price</TableHeaderCell>
                <TableHeaderCell>Stock</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">Actions</span>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const stock = Number(p.available_stock);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <CheckboxInput
                        label={`Select ${p.name}`}
                        isLabelHidden
                        value={selected.has(p.id)}
                        onChange={(on) => toggleOne(p.id, Boolean(on))}
                      />
                    </TableCell>
                    <TableCell>
                      <HStack gap={3} vAlign="center">
                        <Avatar src={p.image || undefined} name={p.name} shape="rounded" size="lg" tooltip={false} />
                        <VStack gap={0}>
                          <Text weight="medium">{p.name}</Text>
                          {p.description ? <Text type="supporting" maxLines={1}>{p.description}</Text> : null}
                        </VStack>
                      </HStack>
                    </TableCell>
                    <TableCell>{p.category || '—'}</TableCell>
                    <TableCell>{formatCents(p.price)}</TableCell>
                    <TableCell>
                      {stock <= 0 ? <Badge variant="error" label="Out of stock" /> : stock <= LOW_STOCK ? <Badge variant="warning" label={`${stock} left`} /> : stock}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.is_paused ? 'neutral' : 'success'} label={p.is_paused ? 'Paused' : 'Live'} />
                    </TableCell>
                    <TableCell>
                      <HStack gap={1} hAlign="end">
                        <IconButton
                          label={p.is_paused ? `Resume ${p.name}` : `Pause ${p.name}`}
                          tooltip={p.is_paused ? 'Resume selling' : 'Pause selling'}
                          variant="ghost"
                          size="sm"
                          icon={p.is_paused ? <Play size={16} /> : <Pause size={16} />}
                          clickAction={() => togglePause(p)}
                        />
                        <IconButton label={`Edit ${p.name}`} tooltip="Edit" variant="ghost" size="sm" icon={<Pencil size={16} />} onClick={() => setEditing(p)} />
                        <IconButton label={`Delete ${p.name}`} tooltip="Delete" variant="ghost" size="sm" icon={<Trash2 size={16} />} onClick={() => setDeleting(p)} />
                      </HStack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        </>
      )}

      {editing ? (
        <ProductDialog
          product={editing.id ? editing : null}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setNotice({status: 'success', title: 'Product saved'});
            load();
          }}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete product?"
        description={`"${deleting?.name}" will be removed from your store. This cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
        onConfirm={() => remove(deleting)}
      />

      <ConfirmDialog
        isOpen={bulkDelete}
        onOpenChange={setBulkDelete}
        title={`Delete ${selected.size} products?`}
        description="They will be removed from your store. This cannot be undone."
        confirmLabel="Delete all"
        isDestructive
        onConfirm={() => bulk('delete')}
      />
    </>
  );
}
