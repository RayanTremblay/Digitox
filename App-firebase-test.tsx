import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TestFirebase = () => {
  const [firebaseStatus, setFirebaseStatus] = useState('Testing...');
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
          const testFirebase = async () => {
        const testResults: string[] = [];
        
        try {
          testResults.push('1. Starting Firebase test...');
          
          // Test Firebase config import
          const firebaseModule = await import('./firebase/firebaseConfig');
          testResults.push('2. Firebase module imported successfully');
          
          // Check what's in the module
          testResults.push(`3. Module keys: ${Object.keys(firebaseModule).join(', ')}`);
          
          const { auth, db, app, firebaseConfig } = firebaseModule;
          
          // Test each service
          testResults.push(`4. App: ${app ? 'OK' : 'MISSING'}`);
          testResults.push(`5. Auth: ${auth ? 'OK' : 'MISSING'}`);
          testResults.push(`6. DB: ${db ? 'OK' : 'MISSING'}`);
          testResults.push(`7. Config: ${firebaseConfig ? 'OK' : 'MISSING'}`);
          
          if (auth && db && app) {
            setFirebaseStatus('✅ Firebase loaded successfully!');
          } else {
            setFirebaseStatus('❌ Firebase services missing');
          }
          
        } catch (error: any) {
          testResults.push(`❌ Error: ${error.message}`);
          setFirebaseStatus(`❌ Firebase error: ${error.message}`);
        }
        
        setDetails(testResults);
      };

    testFirebase();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Detailed Test</Text>
      <Text style={styles.status}>{firebaseStatus}</Text>
      
      <View style={styles.details}>
        {details.map((detail, index) => (
          <Text key={index} style={styles.detail}>{detail}</Text>
        ))}
      </View>
    </View>
  );
};

export default function App() {
  return <TestFirebase />;
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
  status: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  details: {
    width: '100%',
  },
  detail: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'left',
  },
}); 