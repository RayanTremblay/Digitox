import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple debug app to test if basic React Native is working
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Debug App - React Native is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1B1E',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
}); 