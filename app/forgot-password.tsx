// app/forgot-password.tsx
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Mail, KeyRound } from 'lucide-react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { supabase } from './lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { email: initialEmail, portal } = useLocalSearchParams<{ email: string; portal: string }>();
  const { signIn } = useSignIn();

  const [email, setEmail] = useState(initialEmail || '');
  const [isLoading, setIsLoading] = useState(false);

  const isCustomer = portal === 'customer';
  const portalColor = isCustomer ? '#F97316' : '#10B981';

  const handleSendResetCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Check if user exists in Supabase
      const { data: existingUser, error: dbError } = await supabase
        .from('customers')
        .select('email, clerk_user_id')
        .eq('email', email)
        .single();

      if (dbError || !existingUser) {
        Alert.alert(
          'Account Not Found',
          'No account found with this email address.'
        );
        setIsLoading(false);
        return;
      }

      // Check if user has completed first login (has clerk_user_id)
      if (!existingUser.clerk_user_id) {
        Alert.alert(
          'Account Not Activated',
          'This account has not been activated yet. Please complete your first login with the OTP sent to your email.'
        );
        setIsLoading(false);
        return;
      }

      // Send password reset code via Clerk
      try {
        await signIn?.create({
          strategy: 'reset_password_email_code',
          identifier: email,
        });

        Alert.alert(
          'Reset Code Sent! ✅',
          'We\'ve sent a password reset code to your email. Please check your inbox.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.push(`/reset-password?email=${encodeURIComponent(email)}&portal=${portal}`);
              }
            }
          ]
        );
      } catch (clerkError: any) {
        console.error('Clerk error:', clerkError);
        const errorMessage = clerkError.errors?.[0]?.message || 'Failed to send reset code';
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      console.error('Reset error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
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
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <ArrowLeft size={24} color="#6B7280" strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${portalColor}20` }]}>
          <KeyRound size={40} color={portalColor} strokeWidth={2} />
        </View>

        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a code to reset your password.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: portalColor }, isLoading && styles.disabledButton]}
            onPress={handleSendResetCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send Reset Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={handleBack}
            disabled={isLoading}
          >
            <Text style={[styles.backToLoginText, { color: portalColor }]}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
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
    gap: 20,
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
  sendButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToLoginText: {
    fontSize: 16,
    fontWeight: '600',
  },
});