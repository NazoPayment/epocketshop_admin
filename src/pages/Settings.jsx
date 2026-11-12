import {useState} from 'react';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {FileInput} from '@astryxdesign/core/FileInput';
import {FormLayout} from '@astryxdesign/core/FormLayout';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import {RadioList, RadioListItem} from '@astryxdesign/core/RadioList';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Switch} from '@astryxdesign/core/Switch';
import {Tab, TabList} from '@astryxdesign/core/TabList';
import {Text} from '@astryxdesign/core/Text';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';
import {VStack} from '@astryxdesign/core/VStack';

import PageHeader from '../components/PageHeader.jsx';
import Notice from '../components/Notice.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {useThemeMode} from '../context/ThemeModeContext.jsx';
import {useInstallPrompt} from '../hooks/useInstallPrompt.js';
import {businessApi} from '../api/services.js';
import {buildBusinessPayload, deliveryLabel, PAYMENT_METHODS} from '../utils/business.js';
import {fileToDataUri, formatCents} from '../utils/format.js';

const MAX_LOGO_BYTES = 3 * 1024 * 1024;

export default function Settings() {
  const [tab, setTab] = useState('profile');
  return (
    <>
      <PageHeader title="Settings" description="Your store profile, payments, payouts and delivery." />
      <TabList value={tab} onChange={setTab} hasDivider>
        <Tab value="profile" label="Store profile" />
        <Tab value="payments" label="Payments & orders" />
        <Tab value="payouts" label="Payouts" />
        <Tab value="delivery" label="Delivery" />
        <Tab value="account" label="Account" />
      </TabList>
      {tab === 'profile' ? <ProfileTab /> : null}
      {tab === 'payments' ? <PaymentsTab /> : null}
      {tab === 'payouts' ? <PayoutsTab /> : null}
      {tab === 'delivery' ? <DeliveryTab /> : null}
      {tab === 'account' ? <AccountTab /> : null}
    </>
  );
}

function ProfileTab() {
  const {business, patchBusiness} = useAuth();
  const [orderPhrase, setOrderPhrase] = useState(business.orderPhrase);
  const [description, setDescription] = useState(business.description);
  const [address, setAddress] = useState(business.address);
  const [coordinates, setCoordinates] = useState(business.coordinates);
  const [instagram, setInstagram] = useState(business.social.instagram);
  const [facebook, setFacebook] = useState(business.social.facebook);
  const [twitter, setTwitter] = useState(business.social.twitter);
  const [logo, setLogo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  function pickLogo(file) {
    if (file && (!file.type.startsWith('image/') || file.size > MAX_LOGO_BYTES)) {
      return setNotice({status: 'error', title: 'Logo must be an image of 3 MB or less.'});
    }
    setNotice(null);
    setLogo(file);
  }

  async function save() {
    setBusy(true);
    setNotice(null);
    const overrides = {
      order_phrase: orderPhrase,
      description,
      address,
      coordinates,
      facebook,
      instagram,
      twitter,
    };
    if (logo) overrides.logo_url = await fileToDataUri(logo);
    const res = await businessApi.update(buildBusinessPayload(business, overrides));
    setBusy(false);
    if (res.ok) {
      const fresh = await businessApi.get(business.businessId);
      const remote = fresh.ok ? fresh.data?.business_details || fresh.data : null;
      patchBusiness({
        order_phrase: orderPhrase,
        description,
        address,
        coordinates,
        social_media: {facebook, instagram, twitter},
        ...(remote && typeof remote === 'object' && remote.logo_url ? {logo_url: remote.logo_url} : {}),
      });
      setLogo(null);
      setNotice({status: 'success', title: 'Store profile saved'});
    } else setNotice({status: 'error', title: 'Could not save', description: res.message});
  }

  return (
    <Card>
      <VStack gap={4}>
        <Notice notice={notice} onDismiss={() => setNotice(null)} />
        <HStack gap={4} vAlign="center" wrap="wrap">
          <Avatar name={business.businessName} src={business.logoUrl || undefined} size="xl" />
          <VStack gap={1}>
            <Heading level={3}>{business.businessName}</Heading>
            <Text type="supporting">Your store name is part of your shop link, so it can't be changed here.</Text>
          </VStack>
        </HStack>
        <FileInput label="Store logo" accept="image/*" value={logo} onChange={pickLogo} isOptional description="Square images work best." />
        <FormLayout>
          <TextInput label="Order phrase" description="The greeting customers see when they start an order." value={orderPhrase} onChange={setOrderPhrase} isOptional />
          <TextArea label="About your store" rows={3} value={description} onChange={setDescription} isOptional />
          <TextInput label="Country" value={address} onChange={setAddress} />
          <TextInput label="Business address" value={coordinates} onChange={setCoordinates} />
          <TextInput label="Instagram" placeholder="https://instagram.com/yourshop" value={instagram} onChange={setInstagram} isOptional />
          <TextInput label="Facebook" placeholder="https://facebook.com/yourshop" value={facebook} onChange={setFacebook} isOptional />
          <TextInput label="X / Twitter" placeholder="https://x.com/yourshop" value={twitter} onChange={setTwitter} isOptional />
        </FormLayout>
        <div>
          <Button label="Save changes" variant="primary" isLoading={busy} onClick={save} />
        </div>
      </VStack>
    </Card>
  );
}

function PaymentsTab() {
  const {business, patchBusiness} = useAuth();
  const [method, setMethod] = useState(business.paymentMethod);
  const [invoiceFormat, setInvoiceFormat] = useState(business.invoiceFormat);
  const [trackInventory, setTrackInventory] = useState(business.trackInventory);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function save() {
    setBusy(true);
    setNotice(null);
    const res = await businessApi.update({
      ...buildBusinessPayload(business, {invoice_format: invoiceFormat, track_inventory: trackInventory}),
      payment_method: method,
    });
    setBusy(false);
    if (res.ok) {
      patchBusiness({payment_method: method, invoice_format: invoiceFormat, track_inventory: trackInventory});
      setNotice({status: 'success', title: 'Settings saved'});
    } else setNotice({status: 'error', title: 'Could not save', description: res.message});
  }

  return (
    <Card>
      <VStack gap={5}>
        <Notice notice={notice} onDismiss={() => setNotice(null)} />
        <RadioList label="How customers can pay" value={method} onChange={setMethod}>
          {PAYMENT_METHODS.map((m) => (
            <RadioListItem key={m.value} value={m.value} label={m.label} description={m.description} />
          ))}
        </RadioList>
        <Switch
          label="Track inventory"
          description="Stock comes down automatically when you sell, and sold-out products stop taking orders."
          value={trackInventory}
          onChange={setTrackInventory}
        />
        <Switch
          label="Use invoice format"
          description="Send customers a formal invoice document with each order."
          value={invoiceFormat}
          onChange={setInvoiceFormat}
        />
        <div>
          <Button label="Save changes" variant="primary" isLoading={busy} onClick={save} />
        </div>
      </VStack>
    </Card>
  );
}

function PayoutsTab() {
  const {business, vendor, patchVendor} = useAuth();
  const bank = vendor?.bank_details || {};
  const [name, setName] = useState(bank.bank_name || '');
  const [account, setAccount] = useState(bank.account_number ? String(bank.account_number) : '');
  const [branch, setBranch] = useState(bank.branch_code || '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function save() {
    if (!name.trim() || !/^\d{5,20}$/.test(account.trim()) || !/^\d{4,8}$/.test(branch.trim())) {
      return setNotice({
        status: 'error',
        title: 'Check your bank details',
        description: 'Enter the bank name, an account number (digits only) and a numeric branch code.',
      });
    }
    setBusy(true);
    setNotice(null);
    const res = await businessApi.updateBank({
      business_id: business.businessId,
      name: name.trim(),
      account_number: account.trim(),
      branch_code: branch.trim(),
    });
    setBusy(false);
    if (res.ok) {
      patchVendor({bank_details: {bank_name: name.trim(), account_number: Number(account), branch_code: branch.trim()}});
      setNotice({status: 'success', title: 'Bank details saved'});
    } else setNotice({status: 'error', title: 'Could not save', description: res.message});
  }

  return (
    <Card>
      <VStack gap={4}>
        <Notice notice={notice} onDismiss={() => setNotice(null)} />
        <Text type="supporting">Where we send the money you earn from online payments.</Text>
        <FormLayout>
          <TextInput label="Bank name" value={name} onChange={setName} isRequired />
          <TextInput label="Account number" inputMode="numeric" autoComplete="off" value={account} onChange={setAccount} isRequired />
          <TextInput label="Branch code" inputMode="numeric" autoComplete="off" value={branch} onChange={setBranch} isRequired />
        </FormLayout>
        <div>
          <Button label="Save bank details" variant="primary" isLoading={busy} onClick={save} />
        </div>
      </VStack>
    </Card>
  );
}

function DeliveryTab() {
  const {business} = useAuth();
  const options = business.deliveryOptions;
  return (
    <Card>
      <VStack gap={4}>
        <Text type="supporting">
          Delivery methods currently set for your store. Editing delivery rates is available in the mobile app.
        </Text>
        {options.length === 0 ? (
          <Text>No delivery methods have been set up yet.</Text>
        ) : (
          <VStack gap={3}>
            {options.map((d) => {
              const enabled = d.enabled === true || String(d.enabled) === 'true';
              return (
                <HStack key={d.id ?? d.type} hAlign="between" vAlign="center" wrap="wrap" gap={2}>
                  <VStack gap={0}>
                    <Text weight="medium">{deliveryLabel(d.type)}</Text>
                    <Text type="supporting">
                      {Number(d.rate) > 0 ? formatCents(d.rate) : 'Free'}
                      {d.max_delivery_distance ? ` · up to ${d.max_delivery_distance} km` : ''}
                    </Text>
                  </VStack>
                  <Badge variant={enabled ? 'success' : 'neutral'} label={enabled ? 'On' : 'Off'} />
                </HStack>
              );
            })}
          </VStack>
        )}
      </VStack>
    </Card>
  );
}

function AccountTab() {
  const {vendor, business, logout} = useAuth();
  const {mode, setMode} = useThemeMode();
  const {canInstall, installed, isIos, install} = useInstallPrompt();
  return (
    <Card>
      <VStack gap={4}>
        <VStack gap={2}>
          <Text type="supporting">Install on your device</Text>
          {installed ? (
            <Text>The app is installed on this device.</Text>
          ) : canInstall ? (
            <div>
              <Button label="Install app" variant="primary" onClick={install} />
            </div>
          ) : isIos ? (
            <Text>On iPhone or iPad, tap the Share button in Safari, then choose Add to Home Screen.</Text>
          ) : (
            <Text type="supporting">
              Use your browser's menu (Install app or Add to Home Screen) to add this to your device. This option appears once the site is served over HTTPS.
            </Text>
          )}
        </VStack>
        <VStack gap={2}>
          <Text type="supporting">Appearance</Text>
          <div>
            <SegmentedControl label="Colour mode" value={mode} onChange={setMode}>
              <SegmentedControlItem value="light" label="Light" />
              <SegmentedControlItem value="dark" label="Dark" />
              <SegmentedControlItem value="system" label="System" />
            </SegmentedControl>
          </div>
        </VStack>
        <VStack gap={1}>
          <Text type="supporting">Name</Text>
          <Text>{[vendor?.name, vendor?.surname].filter(Boolean).join(' ') || '—'}</Text>
        </VStack>
        <VStack gap={1}>
          <Text type="supporting">Phone</Text>
          <Text>{vendor?.phone_number || '—'}</Text>
        </VStack>
        <VStack gap={1}>
          <Text type="supporting">Email</Text>
          <Text>{vendor?.email || '—'}</Text>
        </VStack>
        <VStack gap={1}>
          <Text type="supporting">Store</Text>
          <Text>{business.businessName}</Text>
        </VStack>
        <div>
          <Button label="Sign out" variant="destructive" onClick={logout} />
        </div>
      </VStack>
    </Card>
  );
}
