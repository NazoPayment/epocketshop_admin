import {useEffect, useMemo, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Divider} from '@astryxdesign/core/Divider';
import {FileInput} from '@astryxdesign/core/FileInput';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import {IconButton} from '@astryxdesign/core/IconButton';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {Switch} from '@astryxdesign/core/Switch';
import {Text} from '@astryxdesign/core/Text';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';
import {VStack} from '@astryxdesign/core/VStack';
import {Plus, Trash2} from 'lucide-react';

import Notice from './Notice.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {productApi} from '../api/services.js';
import {centsToInput, fileToBase64, inputToCents} from '../utils/format.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Editable list of {label, price} pairs, used for both "extras" and "options". */
function PairList({title, help, nameLabel, items, onChange}) {
  const update = (i, patch) => onChange(items.map((it, idx) => (idx === i ? {...it, ...patch} : it)));
  return (
    <VStack gap={2}>
      <VStack gap={2}>
        <VStack gap={0}>
          <Heading level={4}>{title}</Heading>
          <Text type="supporting">{help}</Text>
        </VStack>
        <div>
          <Button
            label={`Add ${nameLabel.toLowerCase()}`}
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => onChange([...items, {name: '', price: 0}])}
          />
        </div>
      </VStack>
      {items.map((it, i) => (
        <HStack key={i} gap={2} vAlign="end">
          <div style={{flex: 1}}>
            <TextInput label={`${nameLabel} ${i + 1}`} value={it.name} onChange={(v) => update(i, {name: v})} />
          </div>
          <NumberInput
            label="Price (R)"
            value={it.price}
            min={0}
            isIntegerOnly
            width={120}
            onChange={(v) => update(i, {price: v})}
          />
          <IconButton
            label={`Remove ${nameLabel.toLowerCase()} ${i + 1}`}
            variant="ghost"
            icon={<Trash2 size={16} />}
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
          />
        </HStack>
      ))}
    </VStack>
  );
}

export default function ProductDialog({product, categories = [], onClose, onSaved}) {
  const {business} = useAuth();
  const isEdit = Boolean(product?.id);

  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState(product?.category || '');
  const [price, setPrice] = useState(product ? centsToInput(product.price) : '');
  const [stock, setStock] = useState(product?.available_stock ?? 1);
  const [paused, setPaused] = useState(Boolean(product?.is_paused));
  const [extras, setExtras] = useState((product?.extras || []).map((x) => ({name: x.name || '', price: x.price || 0})));
  const [options, setOptions] = useState((product?.options || []).map((x) => ({name: x.option || '', price: x.price || 0})));
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  function pickFile(next) {
    if (!next) return setFile(null);
    if (!next.type.startsWith('image/')) {
      return setNotice({status: 'error', title: 'Choose an image file.'});
    }
    if (next.size > MAX_IMAGE_BYTES) {
      return setNotice({status: 'error', title: 'Images must be 5 MB or smaller.'});
    }
    setNotice(null);
    setFile(next);
  }

  async function save() {
    if (!name.trim()) return setNotice({status: 'error', title: 'Give your product a name.'});
    const cents = inputToCents(price);
    if (cents <= 0) return setNotice({status: 'error', title: 'Enter a price greater than zero.'});

    setBusy(true);
    setNotice(null);

    const cleanExtras = extras.filter((x) => x.name.trim()).map((x) => ({name: x.name.trim(), add: true, price: Number(x.price) || 0}));
    const cleanOptions = options.filter((x) => x.name.trim()).map((x) => ({option: x.name.trim(), price: Number(x.price) || 0}));
    const image = file ? await fileToBase64(file) : null;

    const common = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price: cents,
      available_stock: Number(stock) || 0,
      business_name: business.businessName,
      business_id: business.businessId,
      vendor_id: business.vendorId,
      extras: cleanExtras,
      options: cleanOptions,
      is_paused: paused,
    };

    const res = isEdit
      ? await productApi.update({id: product.id, ...common, ...(image ? {image} : {})})
      : await productApi.create({
          ...common,
          variant: '',
          extra_for: null,
          reward_product: false,
          last_update: Math.floor(Date.now() / 1000),
          sku: null,
          image,
        });

    setBusy(false);
    if (res.ok) onSaved();
    else setNotice({status: 'error', title: 'Could not save the product', description: res.message});
  }

  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()} width={680} maxHeight="92dvh" purpose="form">
      <DialogHeader title={isEdit ? 'Edit product' : 'Add product'} onOpenChange={(open) => !open && onClose()} />
      <VStack gap={4} padding={4} className="dialog-body">
        <Notice notice={notice} onDismiss={() => setNotice(null)} />

        <TextInput label="Name" value={name} onChange={setName} isRequired />
        <TextArea label="Description" rows={3} value={description} onChange={setDescription} isOptional />

        <HStack gap={3} wrap="wrap" vAlign="end">
          <div style={{flex: '1 1 200px'}}>
            <TextInput
              label="Category"
              description={categories.length ? `Existing: ${categories.slice(0, 5).join(', ')}` : undefined}
              value={category}
              onChange={setCategory}
            />
          </div>
          <TextInput label="Price (R)" inputMode="decimal" placeholder="0.00" value={price} onChange={setPrice} width={140} isRequired />
          <NumberInput label="In stock" value={stock} min={0} isIntegerOnly width={120} onChange={setStock} />
        </HStack>

        <VStack gap={2}>
          {isEdit && product.image && !file ? (
            <img className="preview-img" src={product.image} alt={`Current image of ${product.name}`} />
          ) : null}
          {file ? <img className="preview-img" src={previewUrl} alt="New product preview" /> : null}
          <FileInput
            label={isEdit ? 'Replace image' : 'Product image'}
            accept="image/*"
            value={file}
            onChange={pickFile}
            isOptional
            description="JPG or PNG, up to 5 MB."
          />
        </VStack>

        <Divider />
        <PairList
          title="Extras"
          help="Optional add-ons customers can tick, like extra cheese."
          nameLabel="Extra"
          items={extras}
          onChange={setExtras}
        />
        <PairList
          title="Options"
          help="Variants customers choose between, like a size."
          nameLabel="Option"
          items={options}
          onChange={setOptions}
        />

        <Divider />
        <Switch
          label="Pause this product"
          description="Paused products stay in your catalogue but can't be ordered."
          value={paused}
          onChange={setPaused}
        />

        <HStack gap={2} hAlign="end" className="dialog-actions">
          <Button label="Cancel" variant="ghost" onClick={onClose} />
          <Button label={isEdit ? 'Save changes' : 'Add product'} variant="primary" isLoading={busy} onClick={save} />
        </HStack>
      </VStack>
    </Dialog>
  );
}
