import {useEffect, useState} from 'react';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {CheckboxInput} from '@astryxdesign/core/CheckboxInput';
import {FileInput} from '@astryxdesign/core/FileInput';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';

import PageHeader from '../components/PageHeader.jsx';
import Notice from '../components/Notice.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {businessApi} from '../api/services.js';
import {fileToBase64} from '../utils/format.js';

const MAX_BYTES = 8 * 1024 * 1024;

const STATUS_COPY = {
  not_submitted: {variant: 'neutral', label: 'Not submitted'},
  pending_merchant: {variant: 'warning', label: 'Merchant review pending'},
  pending_business: {variant: 'warning', label: 'Business review pending'},
  approved: {variant: 'success', label: 'Approved'},
  rejected: {variant: 'error', label: 'Rejected'},
};

export default function Verification() {
  const {business, patchBusiness} = useAuth();
  const [notice, setNotice] = useState(null);
  const [idDoc, setIdDoc] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [cipc, setCipc] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState('');

  // Refresh the status from the server so a review decision shows up without signing in again.
  useEffect(() => {
    let cancelled = false;
    businessApi.verificationStatus().then((res) => {
      if (cancelled || !res.ok || !res.data || typeof res.data !== 'object') return;
      const patch = {};
      if (res.data.verified !== undefined) patch.verified = res.data.verified;
      if (res.data.verification_status !== undefined) patch.verification_status = res.data.verification_status;
      if (Object.keys(patch).length) patchBusiness(patch);
    });
    return () => {
      cancelled = true;
    };
  }, [patchBusiness]);

  const status = STATUS_COPY[business.verificationStatus] || STATUS_COPY.not_submitted;
  const merchantDone = business.verificationLevel === 'merchant' || business.verificationLevel === 'business';
  const businessDone = business.verificationLevel === 'business';
  const pending = business.verificationStatus.startsWith('pending');

  function validate(file) {
    if (!file) return 'Please attach every required document.';
    if (file.size > MAX_BYTES) return 'Each file must be 8 MB or smaller.';
    return '';
  }

  async function submitMerchant() {
    const problem = validate(idDoc) || validate(selfie) || (accepted ? '' : 'Accept the Code of Conduct to continue.');
    if (problem) return setNotice({status: 'error', title: problem});
    setBusy('merchant');
    const res = await businessApi.submitMerchantVerification({
      idDocument: await fileToBase64(idDoc),
      selfie: await fileToBase64(selfie),
    });
    setBusy('');
    if (res.ok) {
      patchBusiness({verification_status: 'pending_merchant'});
      setIdDoc(null);
      setSelfie(null);
      setNotice({status: 'success', title: 'Submitted for review', description: 'We will notify you once it has been checked.'});
    } else setNotice({status: 'error', title: 'Could not submit', description: res.message});
  }

  async function submitBusiness() {
    const problem = validate(cipc);
    if (problem) return setNotice({status: 'error', title: problem});
    setBusy('business');
    const res = await businessApi.submitBusinessVerification({cipcDocument: await fileToBase64(cipc)});
    setBusy('');
    if (res.ok) {
      patchBusiness({verification_status: 'pending_business'});
      setCipc(null);
      setNotice({status: 'success', title: 'Submitted for review'});
    } else setNotice({status: 'error', title: 'Could not submit', description: res.message});
  }

  return (
    <>
      <PageHeader
        title="Verification"
        description="Verified stores earn more trust from buyers. Verification happens in two steps."
        actions={<Badge variant={status.variant} label={status.label} />}
      />
      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      <Card>
        <VStack gap={4}>
          <HStack hAlign="between" vAlign="center" wrap="wrap">
            <VStack gap={0}>
              <Heading level={3}>Step 1: Merchant verification</Heading>
              <Text type="supporting">Confirm who you are with an ID document and a selfie.</Text>
            </VStack>
            {merchantDone ? <Badge variant="success" label="Verified" /> : null}
          </HStack>
          {merchantDone ? null : (
            <>
              <FileInput label="ID document" description="Photo of your ID, passport or driver's licence." accept="image/*" value={idDoc} onChange={setIdDoc} maxSize={MAX_BYTES} isDisabled={pending} />
              <FileInput label="Selfie" description="A clear photo of your face." accept="image/*" value={selfie} onChange={setSelfie} maxSize={MAX_BYTES} isDisabled={pending} />
              <CheckboxInput
                label="I accept the Code of Conduct"
                description="I will sell honestly and treat customers fairly."
                value={accepted}
                onChange={setAccepted}
                isDisabled={pending}
              />
              <div>
                <Button label="Submit for review" variant="primary" isLoading={busy === 'merchant'} isDisabled={pending} onClick={submitMerchant} />
              </div>
            </>
          )}
        </VStack>
      </Card>

      <Card>
        <VStack gap={4}>
          <HStack hAlign="between" vAlign="center" wrap="wrap">
            <VStack gap={0}>
              <Heading level={3}>Step 2: Business verification</Heading>
              <Text type="supporting">Upload your CIPC certificate, or a sole-trader affidavit.</Text>
            </VStack>
            {businessDone ? <Badge variant="success" label="Verified" /> : null}
          </HStack>
          {businessDone ? null : !merchantDone ? (
            <Text type="supporting">Complete and get approved for step 1 first.</Text>
          ) : (
            <>
              <FileInput label="CIPC certificate or affidavit" accept="image/*,application/pdf" value={cipc} onChange={setCipc} maxSize={MAX_BYTES} isDisabled={pending} />
              <div>
                <Button label="Submit for review" variant="primary" isLoading={busy === 'business'} isDisabled={pending} onClick={submitBusiness} />
              </div>
            </>
          )}
        </VStack>
      </Card>

      {business.verificationStatus === 'rejected' ? (
        <Notice notice={{status: 'warning', title: 'Your last submission was rejected', description: 'Check that your documents are clear and valid, then submit again.'}} />
      ) : null}
    </>
  );
}
