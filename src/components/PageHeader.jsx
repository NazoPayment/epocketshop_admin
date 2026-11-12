import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {HStack} from '@astryxdesign/core/HStack';
import {VStack} from '@astryxdesign/core/VStack';

export default function PageHeader({title, description, actions}) {
  return (
    <HStack gap={4} vAlign="center" hAlign="between" wrap="wrap">
      <VStack gap={1}>
        <Heading level={1}>{title}</Heading>
        {description ? <Text type="supporting">{description}</Text> : null}
      </VStack>
      {actions ? (
        <HStack gap={2} vAlign="center" wrap="wrap">
          {actions}
        </HStack>
      ) : null}
    </HStack>
  );
}
