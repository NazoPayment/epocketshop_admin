import {useState} from 'react';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Grid} from '@astryxdesign/core/Grid';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {VStack} from '@astryxdesign/core/VStack';
import {Check, Copy, Globe, MessageCircle, Share2, Store} from 'lucide-react';

import PageHeader from '../components/PageHeader.jsx';
import Notice from '../components/Notice.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {businessApi} from '../api/services.js';
import {STOREFRONT_URL} from '../api/client.js';
import {storefrontLink} from '../utils/format.js';
import {buildBusinessPayload} from '../utils/business.js';

function ChannelCard({icon, title, status, children}) {
  return (
    <Card>
      <VStack gap={3}>
        <HStack hAlign="between" vAlign="center">
          <HStack gap={2} vAlign="center">
            {icon}
            <Heading level={3}>{title}</Heading>
          </HStack>
          {status}
        </HStack>
        {children}
      </VStack>
    </Card>
  );
}

export default function Channels() {
  const {business, patchBusiness} = useAuth();
  const link = storefrontLink(STOREFRONT_URL, business.businessName);
  const [copied, setCopied] = useState(false);
  const [instagram, setInstagram] = useState(business.social.instagram);
  const [facebook, setFacebook] = useState(business.social.facebook);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice({status: 'warning', title: 'Copy failed', description: 'Select the link and copy it manually.'});
    }
  }

  const shareText = `Big things happening at ${business.businessName}! We're now online. Have a look at our shop: ${link}`;

  async function saveSocial() {
    setSaving(true);
    const res = await businessApi.update(buildBusinessPayload(business, {facebook, instagram}));
    setSaving(false);
    if (res.ok) {
      patchBusiness({social_media: {facebook, instagram, twitter: business.social.twitter}});
      setNotice({status: 'success', title: 'Social links saved'});
    } else setNotice({status: 'error', title: 'Could not save', description: res.message});
  }

  return (
    <>
      <PageHeader
        title="Sales channels"
        description="Sell where your customers already are. Every order lands in the same place, with the same stock and payments."
      />
      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      <Card>
        <VStack gap={3}>
          <Heading level={3}>Your store link</Heading>
          <Text type="supporting">Share this anywhere: WhatsApp status, Instagram bio, flyers, receipts.</Text>
          <HStack gap={2} vAlign="end" wrap="wrap">
            <div style={{flex: '1 1 320px'}}>
              <TextInput label="Store link" isLabelHidden value={link} isReadOnly onChange={() => {}} />
            </div>
            <Button label={copied ? 'Copied' : 'Copy link'} icon={copied ? <Check size={16} /> : <Copy size={16} />} onClick={copy} />
            <Button label="Open store" variant="primary" href={link} target="_blank" rel="noopener noreferrer" />
          </HStack>
        </VStack>
      </Card>

      <Grid columns={{minWidth: 300}} gap={4}>
        <ChannelCard icon={<Store size={20} />} title="Online store" status={<Badge variant="success" label="Live" />}>
          <Text type="supporting">A real storefront customers can browse any time, with your products and checkout.</Text>
          <div>
            <Button label="Open storefront" href={link} target="_blank" rel="noopener noreferrer" />
          </div>
        </ChannelCard>

        <ChannelCard icon={<MessageCircle size={20} />} title="WhatsApp" status={<Badge variant="success" label="Live" />}>
          <Text type="supporting">Customers can order by chat. Share your store on WhatsApp in one tap.</Text>
          <HStack gap={2} wrap="wrap">
            <Button
              label="Share on WhatsApp"
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          </HStack>
        </ChannelCard>

        <ChannelCard
          icon={<Share2 size={20} aria-hidden="true" />}
          title="Instagram"
          status={<Badge variant={instagram ? 'success' : 'neutral'} label={instagram ? 'Linked' : 'Not linked'} />}
        >
          <Text type="supporting">Add your profile so customers can find you, and put your store link in your bio.</Text>
          <TextInput label="Instagram profile" placeholder="https://instagram.com/yourshop" value={instagram} onChange={setInstagram} />
        </ChannelCard>

        <ChannelCard
          icon={<Globe size={20} aria-hidden="true" />}
          title="Facebook"
          status={<Badge variant={facebook ? 'success' : 'neutral'} label={facebook ? 'Linked' : 'Not linked'} />}
        >
          <Text type="supporting">Link your page so your storefront shows where else to find you.</Text>
          <TextInput label="Facebook page" placeholder="https://facebook.com/yourshop" value={facebook} onChange={setFacebook} />
        </ChannelCard>
      </Grid>

      <div>
        <Button
          label="Save social links"
          isLoading={saving}
          onClick={saveSocial}
          isDisabled={instagram === business.social.instagram && facebook === business.social.facebook}
        />
      </div>

      <Text type="supporting">Looking for your store QR code? It's now on your Dashboard.</Text>
    </>
  );
}
