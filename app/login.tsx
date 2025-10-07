import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChefHat, Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { portal } = useLocalSearchParams<{ portal: 'customer' | 'admin' }>();
  const { signIn, setActive } = useSignIn();
  const { login, dispatch: authDispatch } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isCustomer = portal === 'customer';
  const portalColor = isCustomer ? '#F97316' : '#10B981';
  const portalName = isCustomer ? 'Customer' : 'Admin';

  const handleLogin = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      if (isCustomer) {
        // Try to sign in with Clerk to check if user exists
        try {
          const signInAttempt = await signIn?.create({
            identifier: email,
          });

          // If user exists and needs password
          if (signInAttempt?.status === 'needs_first_factor') {
            if (!password) {
              Alert.alert('Error', 'Please enter your password');
              setIsLoading(false);
              return;
            }

            // Try password login
            const result = await signIn?.attemptFirstFactor({
              strategy: 'password',
              password: password,
            });

            if (result?.status === 'complete') {
              await setActive?.({ session: result.createdSessionId });

              // Get user metadata
              const metadata = (result as any).userData?.unsafeMetadata || {};
              const customer = {
                id: (result as any).createdUserId || email,
                name: metadata.name || 'Customer',
                email: email,
                paymentType: metadata.paymentType || 'monthly',
                monthlyBalance: metadata.monthlyBalance || 0,
                totalSpent: metadata.totalSpent || 0,
                isFirstLogin: false,
                registeredAt: metadata.registeredAt || new Date().toISOString(),
              };

              authDispatch({
                type: 'LOGIN',
                userType: 'customer',
                user: customer
              });

              router.replace('/(tabs)');
            }
          }
        } catch (clerkError: any) {
          // If user doesn't exist in Clerk, they need to be registered by admin
          if (clerkError.errors?.[0]?.code === 'form_identifier_not_found') {
            Alert.alert('Error', 'Email not found. Please contact the admin to register your account.');
          } else if (clerkError.errors?.[0]?.code === 'form_password_incorrect') {
            Alert.alert('Error', 'Incorrect password');
          } else {
            // First time user - redirect to OTP verification
            (router.push as any)(`/verify-otp?email=${encodeURIComponent(email)}`);
          }
        }
      } else {
        // Admin login (no Clerk)
        if (!password) {
          Alert.alert('Error', 'Please enter your password');
          setIsLoading(false);
          return;
        }

        const result = await login('admin', email, password);

        if (result.success) {
          router.replace('/(admin)');
        } else {
          Alert.alert('Login Failed', 'Invalid email or password');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const fillDemoCredentials = () => {
    if (isCustomer) {
      setEmail('customer@test.com');
      setPassword('password');
    } else {
      setEmail('admin@test.com');
      setPassword('admin');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <ArrowLeft size={24} color="#6B7280" strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${portalColor}20` }]}>
          <ChefHat size={40} color={portalColor} strokeWidth={2} />
        </View>
        <Text style={styles.title}>{portalName} Login</Text>
        <Text style={styles.subtitle}>
          {isCustomer
            ? 'Access your account to place orders'
            : 'Manage restaurant operations'
          }
        </Text>
      </View>

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

        {isCustomer && (
          <Text style={styles.helperText}>
            First time? Enter your email only - you'll verify with OTP
          </Text>
        )}

        <View style={styles.inputContainer}>
          <Lock size={20} color="#6B7280" strokeWidth={2} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: portalColor }, isLoading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoButton}
          onPress={fillDemoCredentials}
          disabled={isLoading}
        >
          <Text style={[styles.demoButtonText, { color: portalColor }]}>
            Use Demo Credentials
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Demo Credentials:
        </Text>
        <Text style={styles.credentialsText}>
          {isCustomer
            ? 'Email: customer@test.com | Password: password'
            : 'Email: admin@test.com | Password: admin'
          }
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
    lineHeight: 24,
  },
  form: {
    gap: 20,
    marginBottom: 40,
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
  helperText: {
    fontSize: 13,
    color: '#F97316',
    marginTop: -12,
    marginBottom: -8,
    fontStyle: 'italic',
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  demoButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  credentialsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});