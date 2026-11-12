import {Banner} from '@astryxdesign/core/Banner';

/** Inline status message. `notice` is `{status:'success'|'error'|'info'|'warning', title, description}` or null. */
export default function Notice({notice, onDismiss}) {
  if (!notice) return null;
  return (
    <Banner
      status={notice.status}
      title={notice.title}
      description={notice.description}
      isDismissable={Boolean(onDismiss)}
      onDismiss={onDismiss}
      collapsible={false}
    />
  );
}
