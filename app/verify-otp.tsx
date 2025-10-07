import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Shield, ArrowLeft, Mail } from 'lucide-react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useAuth } from '../context/AuthContext';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { signUp } = useSignUp();
  const { dispatch: authDispatch, setPendingEmail } = useAuth();

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyOTP = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }

    setIsVerifying(true);

    try {
      // Verify the email with Clerk
      const completeSignUp = await signUp?.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp?.status === 'complete') {
        // Get user metadata from Clerk
        const metadata = signUp?.unsafeMetadata as any;

        // Create customer object from Clerk metadata
        const customer: any = {
          id: completeSignUp.createdUserId,
          name: metadata?.name || 'Customer',
          email: email,
          paymentType: metadata?.paymentType || 'monthly',
          monthlyBalance: metadata?.monthlyBalance || 0,
          totalSpent: metadata?.totalSpent || 0,
          isFirstLogin: true,
          registeredAt: metadata?.registeredAt || new Date().toISOString(),
        };

        // Log the customer in temporarily
        authDispatch({
          type: 'LOGIN',
          userType: 'customer',
          user: customer
        });

        // Store email for password setup
        setPendingEmail(email);

        // Redirect to set password - DON'T set active session yet
        router.replace('/set-password');
      } else {
        Alert.alert('Error', 'Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      Alert.alert(
        'Verification Failed',
        err.errors?.[0]?.message || 'Invalid verification code. Please try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await signUp?.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Success', 'A new verification code has been sent to your email');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <ArrowLeft size={24} color="#6B7280" strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Shield size={40} color="#F97316" strokeWidth={2} />
        </View>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit verification code to
        </Text>
        <View style={styles.emailContainer}>
          <Mail size={16} color="#F97316" strokeWidth={2} />
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.codeInputContainer}>
          <TextInput
            style={styles.codeInput}
            placeholder="000000"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            editable={!isVerifying}
          />
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, isVerifying && styles.disabledButton]}
          onPress={handleVerifyOTP}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendCode}
          disabled={isVerifying}
        >
          <Text style={styles.resendButtonText}>Didn't receive the code? Resend</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Check your spam folder if you don't see the email
        </Text>
      </View>
    </View>
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
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F97316',
  },
  form: {
    gap: 20,
    marginBottom: 24,
  },
  codeInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F97316',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  codeInput: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 20,
    color: '#1F2937',
    letterSpacing: 8,
  },
  verifyButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  verifyButtonText: {
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
  resendButtonText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});