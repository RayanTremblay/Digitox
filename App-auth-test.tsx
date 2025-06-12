import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

const AuthTest = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      // Test Firebase import
      const firebaseModule = await import('./firebase/firebaseConfig');
      console.log('Firebase module:', firebaseModule);
      
      const { auth, db } = firebaseModule;
      console.log('Auth:', auth);
      console.log('DB:', db);
      
      if (!auth) {
        setResult('❌ Auth is null/undefined');
        setLoading(false);
        return;
      }
      
      // Test auth functions
      const { registerUser } = await import('./firebase/auth');
      console.log('RegisterUser function:', registerUser);
      
      const authResult = await registerUser(email, password);
      console.log('Auth result:', authResult);
      
      if (authResult.success && authResult.user) {
        setResult(`✅ Success! User: ${authResult.user.email}`);
      } else {
        setResult(`❌ Error: ${authResult.error}`);
      }
      
    } catch (error: any) {
      console.error('Test error:', error);
      setResult(`❌ Exception: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Function Test</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#666"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#666"
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.button}
        onPress={testAuth}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Registration'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.result}>{result}</Text>
    </View>
  );
};

export default function App() {
  return <AuthTest />;
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
  input: {
    backgroundColor: '#333',
    color: '#FFF',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    width: '100%',
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  result: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
}); 