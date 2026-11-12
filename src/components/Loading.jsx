import {Spinner} from '@astryxdesign/core/Spinner';

export default function Loading({label = 'Loading'}) {
  return (
    <div className="center-block" role="status">
      <Spinner size="lg" label={label} />
    </div>
  );
}
