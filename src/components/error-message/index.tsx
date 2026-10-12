"use client";

import { Button, Text, VStack } from "@chakra-ui/react";

const ErrorMessage = ({ onRetry }: { onRetry: () => void }) => (
  <VStack py={10} gap={4}>
    <Text color="fg.muted">Could not load kanji. Please try again.</Text>
    <Button variant="outline" onClick={onRetry}>
      Retry
    </Button>
  </VStack>
);

export default ErrorMessage;
