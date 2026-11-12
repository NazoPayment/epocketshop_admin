import {useEffect, useState} from 'react';
import QRCode from 'qrcode';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {Copy, Download, ScanQrCode, Share2} from 'lucide-react';

import {useAuth} from '../context/AuthContext.jsx';
import {businessApi} from '../api/services.js';
import {STOREFRONT_URL} from '../api/client.js';
import {storefrontLink} from '../utils/format.js';

/**
 * The shop QR code: customers scan it at the till or stall to open the store.
 * Uses the server-generated image when available; otherwise (CORS, expired token, outage)
 * it is generated in the browser from the store link, so it always shows.
 */
export default function QrCard() {
  const {business} = useAuth();
  const link = storefrontLink(STOREFRONT_URL, business.businessName);
  const [qr, setQr] = useState('');
  const [failed, setFailed] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;

    async function load() {
      setFailed(false);
      const serverUrl = await businessApi.qrCodeUrl();
      if (cancelled) {
        if (serverUrl) URL.revokeObjectURL(serverUrl);
        return;
      }
      if (serverUrl) {
        objectUrl = serverUrl;
        setQr(serverUrl);
        return;
      }
      try {
        const dataUrl = await QRCode.toDataURL(link, {width: 480, margin: 2, errorCorrectionLevel: 'M'});
        if (!cancelled) setQr(dataUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [link]);

  const message = `Scan or tap to visit ${business.businessName}: ${link}`;
  const enc = encodeURIComponent;
  const targets = [
    {label: 'WhatsApp', href: `https://wa.me/?text=${enc(message)}`},
    {label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(link)}`},
    {label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(`Visit ${business.businessName}`)}&url=${enc(link)}`},
    {label: 'Telegram', href: `https://t.me/share/url?url=${enc(link)}&text=${enc(`Visit ${business.businessName}`)}`},
    {label: 'Email', href: `mailto:?subject=${enc(business.businessName)}&body=${enc(message)}`},
  ];

  // Phones and some desktops can share the QR image itself through the system share sheet
  // (WhatsApp, Instagram, Messages...). Other browsers fall back to the link buttons.
  async function shareImage() {
    setShareNote('');
    try {
      const blob = await (await fetch(qr)).blob();
      const file = new File([blob], `${business.businessName}-qr.png`, {type: blob.type || 'image/png'});
      const data = {files: [file], title: business.businessName, text: message};
      if (navigator.canShare?.(data)) await navigator.share(data);
      else await navigator.share({title: business.businessName, text: message, url: link});
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setShareNote("Sharing isn't available here. Use one of the buttons below.");
      }
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setShareNote('Link copied.');
    } catch {
      setShareNote('Copy failed. Select the link and copy it manually.');
    }
  }

  return (
    <Card>
      <VStack gap={3}>
        <HStack gap={2} vAlign="center">
          <ScanQrCode size={20} aria-hidden="true" />
          <Heading level={3}>Your store QR code</Heading>
        </HStack>
        <Text type="supporting">
          Print it for your till or stall. Customers scan it to open your store and order on their phone.
        </Text>

        {qr ? (
          <>
            <HStack gap={4} vAlign="center" wrap="wrap">
              <img className="qr-img" src={qr} alt={`QR code for ${business.businessName}'s store`} />
              <VStack gap={2}>
                {canNativeShare ? (
                  <Button label="Share QR" variant="primary" icon={<Share2 size={16} />} onClick={shareImage} />
                ) : null}
                <Button
                  label="Download QR"
                  icon={<Download size={16} />}
                  href={qr}
                  download={`${business.businessName}-qr.png`}
                />
                <Text type="supporting" maxLines={1}>
                  {link}
                </Text>
              </VStack>
            </HStack>

            <VStack gap={2}>
              <Text type="supporting">Share your store link</Text>
              <HStack gap={2} wrap="wrap">
                {targets.map((t) => (
                  <Button key={t.label} label={t.label} size="sm" href={t.href} target="_blank" rel="noopener noreferrer" />
                ))}
                <Button label="Copy link" size="sm" variant="ghost" icon={<Copy size={14} />} onClick={copyLink} />
              </HStack>
              {shareNote ? (
                <Text type="supporting" role="status">
                  {shareNote}
                </Text>
              ) : null}
            </VStack>
          </>
        ) : failed ? (
          <Text type="supporting">The QR code couldn't be created right now. Try again later.</Text>
        ) : (
          <Text type="supporting">Loading QR code…</Text>
        )}
      </VStack>
    </Card>
  );
}
