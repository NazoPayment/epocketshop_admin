import {useMemo} from 'react';
import {Text} from '@astryxdesign/core/Text';

import {formatRand} from '../utils/format.js';
import {bucketRevenue} from '../utils/charts.js';

const W = 640;
const H = 200;
const PAD = {top: 12, right: 8, bottom: 28, left: 8};

function labelFor(key, byMonth) {
  const d = new Date(`${key}${byMonth ? '-01' : ''}T00:00:00`);
  return byMonth
    ? d.toLocaleDateString('en-ZA', {month: 'short'})
    : d.toLocaleDateString('en-ZA', {day: 'numeric', month: 'short'});
}

/** Simple dependency-free SVG bar chart of paid revenue. */
export default function RevenueChart({invoices, byMonth = false}) {
  const data = useMemo(() => bucketRevenue(invoices, byMonth), [invoices, byMonth]);

  if (data.length === 0) {
    return <Text type="supporting">No paid orders in this period yet.</Text>;
  }

  const max = Math.max(...data.map((d) => d.total), 1);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const barW = Math.max(Math.min(slot * 0.7, 48), 4);
  const total = data.reduce((s, d) => s + d.total, 0);
  const every = Math.ceil(data.length / 8);

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Paid revenue by ${byMonth ? 'month' : 'day'}: ${formatRand(total)} across ${data.length} ${byMonth ? 'months' : 'days'}. Highest ${formatRand(max)}.`}
    >
      <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} className="chart-axis" />
      {data.map((d, i) => {
        const h = Math.max((d.total / max) * innerH, 2);
        const x = PAD.left + slot * i + (slot - barW) / 2;
        const y = H - PAD.bottom - h;
        return (
          <g key={d.key}>
            <rect x={x} y={y} width={barW} height={h} rx={3} className="chart-bar">
              <title>{`${labelFor(d.key, byMonth)}: ${formatRand(d.total)}`}</title>
            </rect>
            {i % every === 0 ? (
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="chart-label">
                {labelFor(d.key, byMonth)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
