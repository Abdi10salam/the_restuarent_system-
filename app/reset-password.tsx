// app/reset-password.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Lock, KeyRound, Eye, EyeOff } from 'lucide-react-native';
import { useSignIn } from '@clerk/clerk-expo';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email, portal } = useLocalSearchParams<{ email: string; portal: string }>();
  const { signIn } = useSignIn();

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isCustomer = portal === 'customer';
  const portalColor = isCustomer ? '#F97316' : '#10B981';

  const handleResetPassword = async () => {
    // Validation
    if (!code) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Attempt to reset password with code
      const result = await signIn?.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code,
        password: newPassword,
      });

      if (result?.status === 'complete') {
        Alert.alert(
          'Password Reset Successful! ✅',
          'Your password has been changed. You can now login with your new password.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace(`/login?portal=${portal}`);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Unable to reset password. Please try again.');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      const errorMessage = error.errors?.[0]?.message || 'Invalid code or password reset failed';

      if (errorMessage.includes('code')) {
        Alert.alert('Invalid Code', 'The verification code you entered is incorrect or expired.');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);

    try {
      await signIn?.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      Alert.alert('Code Resent! ✅', 'A new verification code has been sent to your email.');
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: `${portalColor}20` }]}>
            <KeyRound size={40} color={portalColor} strokeWidth={2} />
          </View>

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to {email} and create a new password.
          </Text>

          <View style={styles.form}>
            {/* Verification Code Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Verification Code</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* New Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" strokeWidth={2} />
                  ) : (
                    <Eye size={20} color="#6B7280" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>Must be at least 8 characters</Text>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#6B7280" strokeWidth={2} />
                  ) : (
                    <Eye size={20} color="#6B7280" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: portalColor }, isLoading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            {/* Resend Code Link */}
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendCode}
              disabled={isLoading}
            >
              <Text style={[styles.resendText, { color: portalColor }]}>
                Didn't receive code? Resend
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  content: {
    alignItems: 'center',
    paddingTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  passwordHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  resetButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});