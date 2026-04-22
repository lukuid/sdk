// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import { SafeAreaView, Text } from 'react-native';

export default function App() {
  const [status] = React.useState('No standalone React Native package is published yet.');

  return (
    <SafeAreaView style={{ padding: 24 }}>
      <Text style={{ fontSize: 18 }}>LukuID React Native Demo</Text>
      <Text>{status}</Text>
    </SafeAreaView>
  );
}
