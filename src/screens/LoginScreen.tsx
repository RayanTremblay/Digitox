import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { registerUser, loginUser } from '../../firebase/auth';
import { setUserData } from '../../firebase/firestore';
import ErrorHandler from '../utils/errorHandler';

interface LoginScreenProps {
  navigation: any;
  route: {
    params: {
      onAuthSuccess: () => void;
    };
  };
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, route }) => {
  const { onAuthSuccess } = route.params;
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleAuth = async () => {
    // Validate email
    const emailError = ErrorHandler.validateInput(email, {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    });
    if (emailError) {
      ErrorHandler.showErrorAlert(emailError, undefined, 'Invalid Email');
      return;
    }

    // Validate password
    const passwordError = ErrorHandler.validateInput(password, {
      required: true,
      minLength: 6
    });
    if (passwordError) {
      ErrorHandler.showErrorAlert(passwordError, undefined, 'Invalid Password');
      return;
    }

    // Validate registration fields
    if (!isLogin) {
      const firstNameError = ErrorHandler.validateInput(firstName, {
        required: true,
        minLength: 2
      });
      if (firstNameError) {
        ErrorHandler.showErrorAlert(firstNameError, undefined, 'Invalid First Name');
        return;
      }

      const lastNameError = ErrorHandler.validateInput(lastName, {
        required: true,
        minLength: 2
      });
      if (lastNameError) {
        ErrorHandler.showErrorAlert(lastNameError, undefined, 'Invalid Last Name');
        return;
      }

      if (password !== confirmPassword) {
        ErrorHandler.showErrorAlert(
          ErrorHandler.createError(
            ErrorHandler.ERROR_CODES.INVALID_INPUT,
            'Passwords do not match. Please make sure both passwords are identical.'
          ),
          undefined,
          'Password Mismatch'
        );
        return;
      }
    }

    setLoading(true);

    const authOperation = async () => {
      if (isLogin) {
        const result = await loginUser(email, password);
        if (result.success) {
          onAuthSuccess();
          return result;
        } else {
          // Create a Firebase-style error for proper parsing
          const error = new Error(result.error || 'Login failed');
          (error as any).code = 'auth/login-failed';
          throw error;
        }
      } else {
        const result = await registerUser(email, password);
        if (result.success && result.user) {
          await setUserData(result.user.uid, {
            email: email,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            displayName: `${firstName.trim()} ${lastName.trim()}`,
            createdAt: new Date().toISOString(),
          });
          onAuthSuccess();
          return result;
        } else {
          // Create a Firebase-style error for proper parsing
          const error = new Error(result.error || 'Registration failed');
          (error as any).code = 'auth/registration-failed';
          throw error;
        }
      }
    };

    const handleRetry = () => {
      handleAuth(); // Retry the authentication
    };

    const authResult = await ErrorHandler.handleAsync(
      authOperation,
      isLogin ? 'User Login' : 'User Registration',
      true,
      handleRetry
    );

    setLoading(false);
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <LinearGradient
      colors={[colors.background, '#2A2D3A']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>Digitox</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {!isLogin && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor={colors.textSecondary}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor={colors.textSecondary}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.authButton, loading && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              <LinearGradient
                colors={[colors.primary, '#8B7EFF']}
                style={styles.authButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color={colors.text} size="small" />
                ) : (
                  <Text style={styles.authButtonText}>
                    {isLogin ? 'Sign In' : 'Sign Up'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </Text>
              <TouchableOpacity onPress={isLogin ? () => navigation.navigate('Register') : toggleAuthMode}>
                <Text style={styles.switchLink}>
                  {isLogin ? 'Create Account' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  logo: {
    ...typography.logo,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    height: '100%',
  },
  eyeIcon: {
    padding: spacing.xs,
  },
  authButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  authButtonText: {
    ...typography.h3,
    color: colors.text,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  switchText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  switchLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  forgotPasswordText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default LoginScreen;
