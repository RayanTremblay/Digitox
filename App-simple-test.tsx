import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';

const SimpleTest = () => {
  const [showLogin, setShowLogin] = React.useState(false);

  if (showLogin) {
    return (
      <LoginScreen 
        onAuthSuccess={() => {
          setShowLogin(false);
        }} 
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Login Test</Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => setShowLogin(true)}
      >
        <Text style={styles.buttonText}>Test Login Screen</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function App() {
  return <SimpleTest />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1B1E',
    padding: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
}); 