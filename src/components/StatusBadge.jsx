import {Badge} from '@astryxdesign/core/Badge';
import {statusVariant} from '../utils/orders.js';

export default function StatusBadge({status}) {
  return <Badge variant={statusVariant(status)} label={status || 'Unknown'} />;
}
