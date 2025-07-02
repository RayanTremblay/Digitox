import { Alert, Share, Linking, Clipboard } from 'react-native';
import { generateShareMessage, recordInviteSent, InviteRecord } from './referralManager';

export interface ShareOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  method: InviteRecord['method'];
}

// Available sharing platforms
export const SHARE_OPTIONS: ShareOption[] = [
  {
    id: 'message',
    name: 'Messages',
    icon: 'chatbubble',
    color: '#007AFF',
    method: 'message',
  },
  {
    id: 'messenger',
    name: 'Messenger',
    icon: 'logo-facebook',
    color: '#0084FF',
    method: 'messenger',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    icon: 'logo-snapchat',
    color: '#FFFC00',
    method: 'snapchat',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'logo-whatsapp',
    color: '#25D366',
    method: 'whatsapp',
  },
  {
    id: 'copy',
    name: 'Copy Link',
    icon: 'copy',
    color: '#8E8E93',
    method: 'copy',
  },
];

// Share via native share sheet
export const shareViaSystem = async (userId: string, userName?: string): Promise<boolean> => {
  try {
    const message = generateShareMessage(userId, userName);
    
    const result = await Share.share({
      message,
      title: 'Join me on Digitox!',
    });

    if (result.action === Share.sharedAction) {
      await recordInviteSent('message'); // Default to message for system share
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sharing via system:', error);
    Alert.alert('Error', 'Failed to open share menu. Please try again.');
    return false;
  }
};

// Share via specific platform
export const shareViaPlatform = async (
  platform: ShareOption,
  userId: string,
  userName?: string
): Promise<boolean> => {
  try {
    const message = generateShareMessage(userId, userName);
    
    switch (platform.method) {
      case 'copy':
        return await copyToClipboard(message, userId);
        
      case 'message':
        return await shareViaMessages(message);
        
      case 'whatsapp':
        return await shareViaWhatsApp(message);
        
      case 'messenger':
        return await shareViaMessenger(message);
        
      case 'snapchat':
        return await shareViaSnapchat(message);
        
      default:
        return await shareViaSystem(userId, userName);
    }
  } catch (error) {
    console.error(`Error sharing via ${platform.name}:`, error);
    Alert.alert('Error', `Failed to open ${platform.name}. Please try again.`);
    return false;
  }
};

// Copy to clipboard
const copyToClipboard = async (message: string, userId: string): Promise<boolean> => {
  try {
    await Clipboard.setString(message);
    await recordInviteSent('copy');
    
    Alert.alert(
      'Copied! 📋',
      'Referral link copied to clipboard. Share it anywhere you like!',
      [{ text: 'OK' }]
    );
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    Alert.alert('Error', 'Failed to copy to clipboard.');
    return false;
  }
};

// Share via Messages (SMS)
const shareViaMessages = async (message: string): Promise<boolean> => {
  try {
    const url = `sms:?body=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
      await recordInviteSent('message');
      return true;
    } else {
      // Fallback to system share
      return await shareViaSystemFallback(message);
    }
  } catch (error) {
    console.error('Error opening Messages:', error);
    return await shareViaSystemFallback(message);
  }
};

// Share via WhatsApp
const shareViaWhatsApp = async (message: string): Promise<boolean> => {
  try {
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
      await recordInviteSent('whatsapp');
      return true;
    } else {
      Alert.alert(
        'WhatsApp Not Found',
        'WhatsApp is not installed on your device. Would you like to use another sharing method?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use Other Method', onPress: () => shareViaSystemFallback(message) }
        ]
      );
      return false;
    }
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    return await shareViaSystemFallback(message);
  }
};

// Share via Messenger
const shareViaMessenger = async (message: string): Promise<boolean> => {
  try {
    // Try Messenger deep link
    const messengerUrl = `fb-messenger://share?text=${encodeURIComponent(message)}`;
    const canOpenMessenger = await Linking.canOpenURL(messengerUrl);
    
    if (canOpenMessenger) {
      await Linking.openURL(messengerUrl);
      await recordInviteSent('messenger');
      return true;
    } else {
      Alert.alert(
        'Messenger Not Found',
        'Messenger is not installed on your device. Would you like to use another sharing method?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use Other Method', onPress: () => shareViaSystemFallback(message) }
        ]
      );
      return false;
    }
  } catch (error) {
    console.error('Error opening Messenger:', error);
    return await shareViaSystemFallback(message);
  }
};

// Share via Snapchat
const shareViaSnapchat = async (message: string): Promise<boolean> => {
  try {
    // Snapchat doesn't support text sharing via URL scheme, so use system share
    const result = await Share.share({
      message,
      title: 'Share on Snapchat',
    });

    if (result.action === Share.sharedAction) {
      await recordInviteSent('snapchat');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sharing via Snapchat:', error);
    return await shareViaSystemFallback(message);
  }
};

// Fallback to system share
const shareViaSystemFallback = async (message: string): Promise<boolean> => {
  try {
    const result = await Share.share({
      message,
      title: 'Join me on Digitox!',
    });

    if (result.action === Share.sharedAction) {
      await recordInviteSent('message'); // Default method
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error with system share fallback:', error);
    return false;
  }
};

// Open app store for platform installation
export const openAppStore = (platform: string): void => {
  const appStoreUrls: { [key: string]: string } = {
    whatsapp: 'https://apps.apple.com/app/whatsapp-messenger/id310633997',
    messenger: 'https://apps.apple.com/app/messenger/id454638411',
    snapchat: 'https://apps.apple.com/app/snapchat/id447188370',
  };

  const url = appStoreUrls[platform];
  if (url) {
    Linking.openURL(url).catch(err => 
      console.error('Error opening app store:', err)
    );
  }
}; 