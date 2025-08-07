import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { adManager } from './src/utils/adManager';

const AdTest = () => {
  const [sdkInitialized, setSdkInitialized] = useState(false);
  const [adManagerInitialized, setAdManagerInitialized] = useState(false);
  const [adStatus, setAdStatus] = useState('checking...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize Google Mobile Ads SDK
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('Google Mobile Ads SDK initialized successfully');
        console.log('Adapter statuses:', adapterStatuses);
        setSdkInitialized(true);
        
        // Check ad manager status after SDK init
        checkAdManagerStatus();
      })
      .catch(error => {
        console.error('Google Mobile Ads SDK initialization failed:', error);
        setSdkInitialized(false);
      });

    // Check ad manager periodically
    const interval = setInterval(checkAdManagerStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkAdManagerStatus = () => {
    const isInitialized = adManager.getInitializationStatus();
    setAdManagerInitialized(isInitialized);
    
    if (isInitialized) {
      const status = adManager.getAdStatus();
      setAdStatus(status);
    } else {
      setAdStatus('not_initialized');
    }
  };

  const testRewardedAd = async () => {
    setLoading(true);
    
    try {
      console.log('Testing rewarded ad...');
      
      // Check if ad manager is initialized
      if (!adManager.getInitializationStatus()) {
        Alert.alert('Error', 'Ad Manager not initialized yet. Please wait a moment and try again.');
        setLoading(false);
        return;
      }

      // Show the ad
      const result = await adManager.showRewardedAd();
      
      if (result.success) {
        Alert.alert(
          'Success!', 
          `Ad watched successfully!\nReward: ${result.reward?.amount || 0} ${result.reward?.type || 'points'}`
        );
      } else {
        Alert.alert('Failed', 'Ad failed to show. Check console for details.');
      }
    } catch (error: any) {
      console.error('Ad test error:', error);
      Alert.alert('Error', `Ad test failed: ${error.message}`);
    }
    
    setLoading(false);
  };

  const preloadAd = async () => {
    try {
      console.log('Preloading ad...');
      await adManager.preloadAd();
      checkAdManagerStatus();
      Alert.alert('Success', 'Ad preloaded successfully!');
    } catch (error: any) {
      console.error('Preload error:', error);
      Alert.alert('Error', `Preload failed: ${error.message}`);
    }
  };

  const getStatusColor = (status: boolean) => status ? '#4CAF50' : '#F44336';
  const getStatusText = (status: boolean) => status ? 'Ready' : 'Not Ready';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ad System Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>System Status:</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Google Mobile Ads SDK:</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(sdkInitialized) }]}>
            {getStatusText(sdkInitialized)}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Ad Manager:</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(adManagerInitialized) }]}>
            {getStatusText(adManagerInitialized)}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Ad Status:</Text>
          <Text style={[styles.statusValue, { color: adStatus === 'ready' ? '#4CAF50' : '#FF9800' }]}>
            {adStatus}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, { opacity: adManagerInitialized ? 1 : 0.5 }]}
        onPress={preloadAd}
        disabled={!adManagerInitialized}
      >
        <Text style={styles.buttonText}>Preload Ad</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.primaryButton, { opacity: adManagerInitialized ? 1 : 0.5 }]}
        onPress={testRewardedAd}
        disabled={loading || !adManagerInitialized}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Rewarded Ad'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.instructions}>
        1. Wait for both systems to be ready{'\n'}
        2. Preload an ad (optional){'\n'}
        3. Test the rewarded ad{'\n'}
        4. Check console for detailed logs
      </Text>
    </View>
  );
};

export default function App() {
  return <AdTest />;
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#2A2B2E',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    width: '100%',
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#555',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructions: {
    color: '#AAAAAA',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});