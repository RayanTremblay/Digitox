import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { registerUser } from '../../firebase/auth';
import { setUserData } from '../../firebase/firestore';
import ErrorHandler from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';

interface RegisterScreenProps {
  navigation: any;
  route: {
    params: {
      onAuthSuccess: () => void;
    };
  };
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation, route }) => {
  const { onAuthSuccess } = route.params;
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    // Validate first name
    const firstNameError = ErrorHandler.validateInput(formData.firstName, {
      required: true,
      minLength: 2,
      maxLength: 50
    });
    if (firstNameError) {
      ErrorHandler.showErrorAlert(firstNameError, undefined, 'Invalid First Name');
      return false;
    }

    // Validate last name
    const lastNameError = ErrorHandler.validateInput(formData.lastName, {
      required: true,
      minLength: 2,
      maxLength: 50
    });
    if (lastNameError) {
      ErrorHandler.showErrorAlert(lastNameError, undefined, 'Invalid Last Name');
      return false;
    }

    // Validate email
    const emailError = ErrorHandler.validateInput(formData.email, {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    });
    if (emailError) {
      ErrorHandler.showErrorAlert(emailError, undefined, 'Invalid Email');
      return false;
    }

    // Validate password
    const passwordError = ErrorHandler.validateInput(formData.password, {
      required: true,
      minLength: 6
    });
    if (passwordError) {
      ErrorHandler.showErrorAlert(passwordError, undefined, 'Invalid Password');
      return false;
    }

    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      ErrorHandler.showErrorAlert(
        ErrorHandler.createError(
          ErrorHandler.ERROR_CODES.INVALID_INPUT,
          'Passwords do not match. Please make sure both passwords are identical.'
        ),
        undefined,
        'Password Mismatch'
      );
      return false;
    }

    // Check terms agreement
    if (!agreedToTerms) {
      ErrorHandler.showErrorAlert(
        ErrorHandler.createError(
          ErrorHandler.ERROR_CODES.INVALID_INPUT,
          'Please agree to the Terms of Service and Privacy Policy to continue.'
        ),
        undefined,
        'Terms Required'
      );
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    const registrationOperation = async () => {
      const result = await registerUser(formData.email, formData.password);
      
      if (result.success && result.user) {
        // Save user profile data
        await setUserData(result.user.uid, {
          email: formData.email,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          displayName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          createdAt: new Date().toISOString(),
          agreedToTerms: true,
          agreedAt: new Date().toISOString(),
        });
        
        onAuthSuccess();
        return result;
      } else {
        const error = new Error(result.error || 'Registration failed');
        (error as any).code = 'auth/registration-failed';
        throw error;
      }
    };

    const handleRetry = () => {
      handleRegister();
    };

    await ErrorHandler.handleAsync(
      registrationOperation,
      'User Registration',
      true,
      handleRetry
    );

    setLoading(false);
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.background, '#2A2D3A']} style={styles.container}>
        <LoadingSpinner text="Creating your account..." />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.background, '#2A2D3A']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Detoxly and start your digital wellness journey</Text>
          </View>

          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor={colors.textSecondary}
                value={formData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor={colors.textSecondary}
                value={formData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                placeholderTextColor={colors.textSecondary}
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a strong password"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.password}
                  onChangeText={(text) => updateField('password', text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateField('confirmPassword', text)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms Agreement */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.linkText}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, !agreedToTerms && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={!agreedToTerms}
            >
              <Text style={styles.registerButtonText}>Create Account</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity style={styles.loginContainer} onPress={goToLogin}>
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.linkText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: 50,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    marginRight: spacing.sm,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default RegisterScreen;