import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Shield, ArrowLeft, Mail } from 'lucide-react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useAuth } from '../context/AuthContext';
import { supabase } from './lib/supabase';

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
      console.log('========== OTP VERIFICATION START ==========');
      console.log('Email:', email);
      
      // Get customer data first
      console.log('1. Fetching customer from Supabase...');
      const { data: customerData, error: dbError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .single();

      if (dbError || !customerData) {
        console.error('❌ Customer not found in Supabase');
        Alert.alert('Error', 'Customer data not found. Please contact admin.');
        setIsVerifying(false);
        return;
      }

      console.log('✅ Customer found:', customerData.name);

      // Verify with Clerk
      console.log('2. Attempting Clerk verification...');
      const verificationResult = await signUp?.attemptEmailAddressVerification({
        code,
      });

      // Don't try to stringify - just check properties
      console.log('3. Verification completed');
      console.log('Status:', verificationResult?.status);
      console.log('Created User ID:', verificationResult?.createdUserId);
      console.log('Created Session ID:', verificationResult?.createdSessionId);

      const status = verificationResult?.status;
      
      // Handle missing_requirements status (password not set yet)
      if (status === 'missing_requirements') {
        console.log('✅ Status is missing_requirements (normal for first signup)');
        console.log('Email verification successful, proceeding to password setup...');
        // This is actually OK - email is verified, just needs password
        
      } else if (status === 'complete') {
        console.log('✅ Status is complete');
        
      } else {
        console.log(`❌ Unexpected status: ${status}`);
        Alert.alert('Error', 'Verification failed. Please try again.');
        setIsVerifying(false);
        return;
      }

      // Update Supabase with Clerk user ID (in background)
      if (verificationResult?.createdUserId) {
        console.log('4. Updating Clerk user ID in Supabase...');
        supabase
          .from('customers')
          .update({ clerk_user_id: verificationResult.createdUserId })
          .eq('email', email)
          .then(({ error }) => {
            if (error) {
              console.error('Supabase update error:', error);
            } else {
              console.log('✅ Supabase updated');
            }
          });
      }

      // Create customer object
      console.log('5. Creating customer object...');
      const customer: any = {
        id: customerData.id,
        name: customerData.name,
        email: customerData.email,
        paymentType: customerData.payment_type,
        monthlyBalance: parseFloat(customerData.monthly_balance) || 0,
        totalSpent: parseFloat(customerData.total_spent) || 0,
        isFirstLogin: customerData.is_first_login,
        registeredAt: customerData.registered_at,
      };

      console.log('6. Logging in customer...');
      authDispatch({
        type: 'LOGIN',
        userType: 'customer',
        user: customer
      });

      setPendingEmail(email);

      console.log('7. Navigating to password setup...');
      console.log('========== OTP VERIFICATION SUCCESS ==========');
      
      setIsVerifying(false);
      router.replace('/set-password');
      
    } catch (err: any) {
      console.error('========== ERROR ==========');
      console.error('Error message:', err.message);
      console.error('Error code:', err.errors?.[0]?.code);
      
      const errorMessage = err.errors?.[0]?.message || '';
      const errorCode = err.errors?.[0]?.code || '';
      
      // Handle already verified case
      if (errorMessage.includes('already been verified') || 
          errorCode === 'verification_already_verified') {
        console.log('Already verified, proceeding to password setup...');
        
        try {
          const { data: fallbackCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('email', email)
            .single();

          if (fallbackCustomer) {
            const customer: any = {
              id: fallbackCustomer.id,
              name: fallbackCustomer.name,
              email: fallbackCustomer.email,
              paymentType: fallbackCustomer.payment_type,
              monthlyBalance: parseFloat(fallbackCustomer.monthly_balance) || 0,
              totalSpent: parseFloat(fallbackCustomer.total_spent) || 0,
              isFirstLogin: fallbackCustomer.is_first_login,
              registeredAt: fallbackCustomer.registered_at,
            };

            authDispatch({
              type: 'LOGIN',
              userType: 'customer',
              user: customer
            });

            setPendingEmail(email);
            setIsVerifying(false);
            router.replace('/set-password');
            return;
          }
        } catch (recoveryError) {
          console.error('Recovery failed:', recoveryError);
        }
      }

      Alert.alert(
        'Verification Failed',
        errorMessage || 'Invalid verification code. Please try again.'
      );
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await signUp?.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Success', 'A new verification code has been sent to your email');
    } catch (err: any) {
      console.error('Resend error:', err);
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