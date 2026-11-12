import {useEffect, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {HStack} from '@astryxdesign/core/HStack';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {Download, ExternalLink} from 'lucide-react';

import Loading from './Loading.jsx';
import {invoiceApi} from '../api/services.js';

/**
 * Shows an invoice PDF inside the app (full screen, so it works on phones too).
 * The PDF is fetched as a blob so it renders in the in-app frame; if the browser can't
 * fetch it (e.g. CORS), we fall back to the direct URL. Some mobile browsers only render
 * the first page in a frame, so Download / Open are always available.
 */
export default function InvoiceViewer({documentName, title, onClose}) {
  const directUrl = invoiceApi.pdfUrl(documentName);
  const [blobUrl, setBlobUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let created = '';
    setLoading(true);
    fetch(directUrl)
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('bad status'))))
      .then((blob) => {
        if (cancelled) return;
        created = URL.createObjectURL(new Blob([blob], {type: 'application/pdf'}));
        setBlobUrl(created);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [directUrl]);

  const src = blobUrl || directUrl;

  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()} variant="fullscreen" purpose="info">
      <DialogHeader
        title={title}
        onOpenChange={(open) => !open && onClose()}
      />
      <VStack gap={2} padding={2} height="100%">
        <HStack gap={2} wrap="wrap">
          <Button
            label="Download"
            size="sm"
            icon={<Download size={14} />}
            href={src}
            download={`${documentName}.pdf`}
          />
          <Button
            label="Open in browser"
            size="sm"
            variant="ghost"
            icon={<ExternalLink size={14} />}
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
          />
        </HStack>
        {loading ? (
          <Loading label="Loading invoice" />
        ) : (
          <iframe className="pdf-frame" title={title} src={src} />
        )}
        <Text type="supporting">
          If the invoice doesn't appear, use Download or Open in browser.
        </Text>
      </VStack>
    </Dialog>
  );
}
