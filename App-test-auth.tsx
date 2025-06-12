import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

const TestAuthContent = () => {
  const { user, isLoading, isFirstLaunch } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Auth Test</Text>
      <Text style={styles.text}>Loading: {isLoading ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>First Launch: {isFirstLaunch ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>User: {user ? 'Logged in' : 'Not logged in'}</Text>
    </View>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TestAuthContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1B1E',
    padding: 20,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
}); 