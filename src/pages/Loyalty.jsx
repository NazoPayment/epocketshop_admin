import {useCallback, useEffect, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Grid} from '@astryxdesign/core/Grid';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import {IconButton} from '@astryxdesign/core/IconButton';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {VStack} from '@astryxdesign/core/VStack';
import {Plus, Trash2} from 'lucide-react';

import PageHeader from '../components/PageHeader.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Notice from '../components/Notice.jsx';
import Loading from '../components/Loading.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {customerApi, productApi} from '../api/services.js';

export default function Loyalty() {
  const {business} = useAuth();
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [rulesRes, productsRes] = await Promise.all([
      customerApi.loyaltyRules(business.businessId),
      productApi.list(business.businessName),
    ]);
    if (rulesRes.ok) {
      setRules(Array.isArray(rulesRes.data) ? rulesRes.data : []);
      setNotice(null);
    } else {
      setRules([]);
      setNotice({status: 'error', title: 'Could not load loyalty rules', description: rulesRes.message});
    }
    if (productsRes.ok && Array.isArray(productsRes.data?.products)) {
      setCategories([...new Set(productsRes.data.products.map((p) => p.category).filter(Boolean))].sort());
    }
    setLoading(false);
  }, [business.businessId, business.businessName]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(rule) {
    const res = await customerApi.deleteLoyaltyRule(business.businessId, rule.category_name);
    if (res.ok) {
      setNotice({status: 'success', title: 'Loyalty rule deleted'});
      load();
    } else setNotice({status: 'error', title: 'Could not delete the rule', description: res.message});
  }

  return (
    <>
      <PageHeader
        title="Loyalty & rewards"
        description="Reward repeat buyers with stamp cards per product category."
        actions={<Button label="New rule" variant="primary" icon={<Plus size={16} />} onClick={() => setEditing({})} />}
      />
      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      {loading ? (
        <Loading label="Loading rules" />
      ) : rules.length === 0 ? (
        <EmptyState
          title="No loyalty rules yet"
          description="For example: buy 10 coffees, get the 11th free. Customers earn a stamp on every order in the category."
          actions={<Button label="Create a rule" variant="primary" onClick={() => setEditing({})} />}
        />
      ) : (
        <Grid columns={{minWidth: 280}} gap={4}>
          {rules.map((r) => (
            <Card key={r.category_name}>
              <VStack gap={3}>
                <HStack hAlign="between" vAlign="start">
                  <Heading level={3}>{r.category_name}</Heading>
                  <IconButton
                    label={`Delete rule for ${r.category_name}`}
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => setDeleting(r)}
                  />
                </HStack>
                <Text type="supporting">{r.stamps_required ?? 10} stamps to earn</Text>
                <Text>{r.reward_description || 'No reward description'}</Text>
                <div>
                  <Button label="Edit" size="sm" onClick={() => setEditing(r)} />
                </div>
              </VStack>
            </Card>
          ))}
        </Grid>
      )}

      {editing ? (
        <RuleDialog
          rule={editing.category_name ? editing : null}
          categories={categories}
          businessId={business.businessId}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setNotice({status: 'success', title: 'Loyalty rule saved'});
            load();
          }}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete loyalty rule?"
        description={`Customers will stop earning stamps for "${deleting?.category_name}".`}
        confirmLabel="Delete"
        isDestructive
        onConfirm={() => remove(deleting)}
      />
    </>
  );
}

function RuleDialog({rule, categories, businessId, onClose, onSaved}) {
  const isEdit = Boolean(rule);
  const [category, setCategory] = useState(rule?.category_name || '');
  const [stamps, setStamps] = useState(rule?.stamps_required ?? 10);
  const [reward, setReward] = useState(rule?.reward_description || '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function save() {
    if (!category.trim()) return setNotice({status: 'error', title: 'Choose a product category.'});
    if (!reward.trim()) return setNotice({status: 'error', title: 'Describe the reward.'});
    setBusy(true);
    const res = await customerApi.saveLoyaltyRule(businessId, category.trim(), Number(stamps) || 10, reward.trim());
    setBusy(false);
    if (res.ok) onSaved();
    else setNotice({status: 'error', title: 'Could not save the rule', description: res.message});
  }

  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()} width={480} purpose="form">
      <DialogHeader title={isEdit ? 'Edit loyalty rule' : 'New loyalty rule'} onOpenChange={(open) => !open && onClose()} />
      <VStack gap={4} padding={4}>
        <Notice notice={notice} onDismiss={() => setNotice(null)} />
        <TextInput
          label="Product category"
          description={categories.length ? `Your categories: ${categories.join(', ')}` : 'Use the category name from your products.'}
          value={category}
          onChange={setCategory}
          isReadOnly={isEdit}
          isRequired
        />
        <NumberInput label="Stamps required" value={stamps} min={1} max={100} isIntegerOnly onChange={setStamps} />
        <TextInput label="Reward" placeholder="Free coffee of your choice" value={reward} onChange={setReward} isRequired />
        <HStack gap={2} hAlign="end">
          <Button label="Cancel" variant="ghost" onClick={onClose} />
          <Button label="Save rule" variant="primary" isLoading={busy} onClick={save} />
        </HStack>
      </VStack>
    </Dialog>
  );
}
