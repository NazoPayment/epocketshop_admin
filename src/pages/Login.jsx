import {useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {Button} from '@astryxdesign/core/Button';
import {HStack} from '@astryxdesign/core/HStack';
import {Link} from '@astryxdesign/core/Link';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {VStack} from '@astryxdesign/core/VStack';

import AuthLayout from '../components/AuthLayout.jsx';
import Notice from '../components/Notice.jsx';
import {useAuth} from '../context/AuthContext.jsx';

export default function Login() {
  const {login} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!phone.trim() || !password) {
      setNotice({status: 'error', title: 'Enter your phone number and password.'});
      return;
    }
    setBusy(true);
    setNotice(null);
    const res = await login(phone, password);
    setBusy(false);
    if (res.ok) {
      navigate(location.state?.from?.pathname || '/', {replace: true});
    } else {
      setNotice({status: 'error', title: 'Could not sign in', description: res.message});
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your store.">
      <form onSubmit={submit} noValidate>
        <VStack gap={4}>
          <Notice notice={notice} onDismiss={() => setNotice(null)} />
          <TextInput
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0821234567"
            value={phone}
            onChange={setPhone}
            isRequired
          />
          <TextInput
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            isRequired
          />
          <Button label="Sign in" variant="primary" type="submit" isLoading={busy} width="100%" />
          <HStack hAlign="between" wrap="wrap" gap={2}>
            <Link href="/forgot-password">Forgot password?</Link>
            <Text type="supporting">
              New here? <Link href="/register">Create your store</Link>
            </Text>
          </HStack>
        </VStack>
      </form>
    </AuthLayout>
  );
}
