import {Card} from '@astryxdesign/core/Card';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {VStack} from '@astryxdesign/core/VStack';
import {Skeleton} from '@astryxdesign/core/Skeleton';

export default function StatCard({label, value, hint, isLoading}) {
  return (
    <Card>
      <VStack gap={1}>
        <Text type="supporting">{label}</Text>
        {isLoading ? (
          <Skeleton width={96} height={32} />
        ) : (
          <Heading level={2}>{value}</Heading>
        )}
        {hint ? <Text type="supporting">{hint}</Text> : null}
      </VStack>
    </Card>
  );
}
