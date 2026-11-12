import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button} from '@astryxdesign/core/Button';
import {HStack} from '@astryxdesign/core/HStack';
import {Link} from '@astryxdesign/core/Link';
import {Step, Stepper} from '@astryxdesign/core/Stepper';
import {Text} from '@astryxdesign/core/Text';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';
import {VStack} from '@astryxdesign/core/VStack';

import AuthLayout from '../components/AuthLayout.jsx';
import Notice from '../components/Notice.jsx';
import OtpStep from '../components/OtpStep.jsx';
import {authApi, toE164} from '../api/services.js';

const EMPTY = {
  name: '',
  surname: '',
  phone: '',
  email: '',
  businessName: '',
  description: '',
  country: 'South Africa',
  address: '',
  password: '',
  confirm: '',
};

const STEPS = [
  {label: 'About you', title: 'Tell us about you', subtitle: 'So we know who is opening the store.'},
  {label: 'Business', title: 'Name your business', subtitle: 'This becomes your shop link.'},
  {label: 'Location', title: 'Where are you based?', subtitle: 'Customers see this on your store.'},
  {label: 'Password', title: 'Secure your account', subtitle: 'Choose a password you will remember.'},
  {label: 'Verify', title: 'Verify your number', subtitle: 'One last step before your store goes live.'},
];

/** Returns an error message for the given step, or '' when it is valid. */
function validateStep(step, f) {
  if (step === 0) {
    if (!f.name.trim() || !f.surname.trim()) return 'Enter your first name and surname.';
    if (!/^\+?[\d\s-]{9,15}$/.test(f.phone.trim())) return 'Enter a valid phone number.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return 'Enter a valid email address.';
  }
  if (step === 1 && !f.businessName.trim()) return 'Enter your business name.';
  if (step === 2 && !f.country.trim()) return 'Enter your country.';
  if (step === 3) {
    if (f.password.length < 8) return 'Use a password of at least 8 characters.';
    if (f.password !== f.confirm) return 'Passwords do not match.';
  }
  return '';
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const set = (key) => (value) => setForm((f) => ({...f, [key]: value}));
  const current = STEPS[step];
  const isLastForm = step === 3;

  async function submitAccount() {
    setBusy(true);
    const res = await authApi.register({
      phone_number: toE164(form.phone),
      // The shop link is built from the business name, so the app stores it lower-cased.
      business_name: form.businessName.trim().toLowerCase(),
      description: form.description,
      name: form.name.trim(),
      surname: form.surname.trim(),
      email: form.email.trim(),
      password: form.password,
      // Same field mapping as the mobile app: `address` is the country, `coordinates` the street address.
      address: form.country,
      coordinates: form.address,
      device_id: '',
    });
    setBusy(false);
    if (res.ok) {
      setStep(4);
    } else {
      setNotice({status: 'error', title: 'Could not create your store', description: res.message});
    }
  }

  function next(e) {
    e.preventDefault();
    const problem = validateStep(step, form);
    if (problem) return setNotice({status: 'error', title: problem});
    setNotice(null);
    if (isLastForm) submitAccount();
    else setStep(step + 1);
  }

  function back() {
    setNotice(null);
    setStep(step - 1);
  }

  return (
    <AuthLayout title="Create your store" subtitle="Set up in a few quick steps.">
      <VStack gap={6}>
        <Stepper activeStep={step} label="Create your store">
          {STEPS.map((s, i) => (
            <Step key={s.label} step={i} label={s.label} />
          ))}
        </Stepper>

        {step === 4 ? (
          <VStack gap={4}>
            <VStack gap={0}>
              <Text weight="semibold">{current.title}</Text>
              <Text type="supporting">{current.subtitle}</Text>
            </VStack>
            <OtpStep
              phone={toE164(form.phone)}
              submitLabel="Verify and finish"
              onVerified={() => navigate('/login', {replace: true})}
            />
          </VStack>
        ) : (
          <form onSubmit={next} noValidate>
            <VStack gap={4}>
              <VStack gap={0}>
                <Text weight="semibold">{current.title}</Text>
                <Text type="supporting">{current.subtitle}</Text>
              </VStack>
              <Notice notice={notice} onDismiss={() => setNotice(null)} />

              {step === 0 ? (
                <>
                  <TextInput label="First name" autoComplete="given-name" value={form.name} onChange={set('name')} hasAutoFocus isRequired />
                  <TextInput label="Surname" autoComplete="family-name" value={form.surname} onChange={set('surname')} isRequired />
                  <TextInput label="Phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="0821234567" value={form.phone} onChange={set('phone')} isRequired />
                  <TextInput label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} isRequired />
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <TextInput label="Business name" value={form.businessName} onChange={set('businessName')} hasAutoFocus isRequired />
                  <TextArea label="What do you sell?" rows={3} value={form.description} onChange={set('description')} isOptional />
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <TextInput label="Country" value={form.country} onChange={set('country')} hasAutoFocus isRequired />
                  <TextInput label="Business address" autoComplete="street-address" value={form.address} onChange={set('address')} isOptional />
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <TextInput label="Password" type="password" autoComplete="new-password" description="At least 8 characters." value={form.password} onChange={set('password')} hasAutoFocus isRequired />
                  <TextInput label="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} isRequired />
                </>
              ) : null}

              <HStack gap={2} hAlign="between">
                {step > 0 ? <Button label="Back" variant="ghost" onClick={back} /> : <span />}
                <Button label={isLastForm ? 'Create store' : 'Continue'} variant="primary" type="submit" isLoading={busy} />
              </HStack>

              <Text type="supporting">
                Already have a store? <Link href="/login">Sign in</Link>
              </Text>
              <Text type="supporting">
                Not sure yet? <Link href="/plans">See plans & billing</Link>
              </Text>
            </VStack>
          </form>
        )}
      </VStack>
    </AuthLayout>
  );
}
