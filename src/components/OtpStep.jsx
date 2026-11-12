import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {HStack} from '@astryxdesign/core/HStack';
import {TextInput} from '@astryxdesign/core/TextInput';
import {VStack} from '@astryxdesign/core/VStack';

import Notice from './Notice.jsx';
import {authApi} from '../api/services.js';

/** Shared "enter the code we sent you" step for registration and password reset. */
export default function OtpStep({phone, onVerified, submitLabel = 'Verify'}) {
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!otp.trim()) {
      setNotice({status: 'error', title: 'Enter the verification code.'});
      return;
    }
    setBusy(true);
    setNotice(null);
    const res = await authApi.confirmOtp(otp.trim());
    setBusy(false);
    if (res.ok) onVerified();
    else setNotice({status: 'error', title: 'Verification failed', description: res.message});
  }

  async function resend() {
    const res = await authApi.resendOtp(phone);
    setNotice(
      res.ok
        ? {status: 'success', title: 'Code sent', description: 'A new code is on its way.'}
        : {status: 'error', title: 'Could not resend the code', description: res.message},
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <VStack gap={4}>
        <Notice notice={notice} onDismiss={() => setNotice(null)} />
        <TextInput
          label="Verification code"
          description={`We sent a code to ${phone}.`}
          inputMode="numeric"
          autoComplete="one-time-code"
          value={otp}
          onChange={setOtp}
          isRequired
        />
        <HStack gap={2} wrap="wrap">
          <Button label={submitLabel} variant="primary" type="submit" isLoading={busy} />
          <Button label="Resend code" variant="ghost" onClick={resend} />
        </HStack>
      </VStack>
    </form>
  );
}
