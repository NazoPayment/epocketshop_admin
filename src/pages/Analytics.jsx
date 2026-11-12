import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button} from '@astryxdesign/core/Button';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Tab, TabList} from '@astryxdesign/core/TabList';
import {Text} from '@astryxdesign/core/Text';

import PageHeader from '../components/PageHeader.jsx';
import {useAuth} from '../context/AuthContext.jsx';
import {ANALYTICS_URL} from '../api/client.js';

const REPORTS = [
  {value: 'cumulative-sales', label: 'Sales over time'},
  {value: 'sales-by-category', label: 'Sales by category'},
  {value: 'daily-sales', label: 'Daily orders'},
];

export default function Analytics() {
  const {business} = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(REPORTS[0].value);

  if (business.subscription === 0) {
    return (
      <>
        <PageHeader title="Analytics" description="See what's selling and when." />
        <EmptyState
          title="Unlock business insights"
          description="Sales trends, category breakdowns and daily order patterns are available on paid plans."
          actions={<Button label="See plans" variant="primary" onClick={() => navigate('/billing')} />}
        />
      </>
    );
  }

  const src = `${ANALYTICS_URL}/${report}/${encodeURIComponent(business.businessId)}`;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Your numbers across every channel."
        actions={<Button label="Open in new tab" href={src} target="_blank" rel="noopener noreferrer" />}
      />
      <TabList value={report} onChange={setReport} hasDivider>
        {REPORTS.map((r) => (
          <Tab key={r.value} value={r.value} label={r.label} />
        ))}
      </TabList>
      <iframe key={src} className="frame" title={REPORTS.find((r) => r.value === report)?.label} src={src} referrerPolicy="no-referrer" />
      <Text type="supporting">If a report doesn't load here, open it in a new tab.</Text>
    </>
  );
}
