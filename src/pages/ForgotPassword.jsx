import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button} from '@astryxdesign/core/Button';
import {Link} from '@astryxdesign/core/Link';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {VStack} from '@astryxdesign/core/VStack';

import AuthLayout from '../components/AuthLayout.jsx';
import Notice from '../components/Notice.jsx';
import OtpStep from '../components/OtpStep.jsx';
import {authApi, toE164} from '../api/services.js';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('details');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!phone.trim() || !email.trim() || password.length < 8) {
      setNotice({
        status: 'error',
        title: 'Enter your phone, email and a new password of at least 8 characters.',
      });
      return;
    }
    setBusy(true);
    setNotice(null);
    const res = await authApi.resetPassword({
      phone_number: toE164(phone),
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (res.ok) setStep('otp');
    else setNotice({status: 'error', title: 'Could not start the reset', description: res.message});
  }

  if (step === 'otp') {
    return (
      <AuthLayout title="Confirm it's you" subtitle="Enter the code to finish resetting your password.">
        <OtpStep
          phone={toE164(phone)}
          submitLabel="Reset password"
          onVerified={() => navigate('/login', {replace: true})}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll text you a code to confirm the change.">
      <form onSubmit={submit} noValidate>
        <VStack gap={4}>
          <Notice notice={notice} onDismiss={() => setNotice(null)} />
          <TextInput label="Phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="0821234567" value={phone} onChange={setPhone} isRequired />
          <TextInput label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} isRequired />
          <TextInput label="New password" type="password" autoComplete="new-password" value={password} onChange={setPassword} isRequired />
          <Button label="Send code" variant="primary" type="submit" isLoading={busy} width="100%" />
          <Text type="supporting">
            <Link href="/login">Back to sign in</Link>
          </Text>
        </VStack>
      </form>
    </AuthLayout>
  );
}
