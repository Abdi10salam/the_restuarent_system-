// app/login.tsx 
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
  TouchableWithoutFeedback, Keyboard, ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChefHat, Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { useSignIn, useSignUp, useClerk } from '@clerk/clerk-expo';
import { useAuth } from '../context/AuthContext';
import { supabase } from './lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { portal } = useLocalSearchParams<{ portal: 'customer' | 'admin' }>();
  const { signIn, setActive } = useSignIn();
  const { signUp } = useSignUp();
  const { signOut: clerkSignOut } = useClerk();
  const { login, dispatch: authDispatch } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customerExists, setCustomerExists] = useState<boolean | null>(null);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
  const Wrapper = Platform.OS === "web" ? View : TouchableWithoutFeedback;

  const isCustomer = portal === 'customer';
  const portalColor = isCustomer ? '#F97316' : '#10B981';
  const portalName = isCustomer ? 'Customer' : 'Admin';

  const checkCustomerStatus = async (emailInput: string) => {
    if (!emailInput.includes('@') || !emailInput.includes('.')) {
      setCustomerExists(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('is_first_login, clerk_user_id')
        .eq('email', emailInput)
        .single();

      if (data) {
        setCustomerExists(true);
        setIsFirstLogin(data.is_first_login || !data.clerk_user_id);
      } else {
        setCustomerExists(false);
      }
    } catch (err) {
      setCustomerExists(false);
    }
  };

 // Replace the handleLogin function in login.tsx with this:

const handleLogin = async () => {
  if (!email) {
    Alert.alert('Error', 'Please enter your email address');
    return;
  }

  if (!email.includes('@') || !email.includes('.')) {
    Alert.alert('Error', 'Please enter a valid email address');
    return;
  }

  setIsLoading(true);

  // Clear any existing Clerk session
  try {
    await clerkSignOut();
    console.log('Cleared existing session');
  } catch (clearError) {
    console.log('No session to clear');
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    // ========================================
    // STEP 1: Check if user exists in database
    // ========================================
    console.log('🔍 Checking user in database...');
    const { data: existingUser, error: dbError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (dbError || !existingUser) {
      Alert.alert(
        'Account Not Found',
        "This account doesn't exist. Contact your admin to register."
      );
      setIsLoading(false);
      return;
    }

    console.log('✅ User found:', existingUser.name);
    console.log('👤 User role:', existingUser.role);

    const userRole = existingUser.role || 'customer';

    // ========================================
    // STEP 2: First-time login → Send OTP
    // ========================================
    if (existingUser.is_first_login || !existingUser.clerk_user_id) {
      console.log('🆕 First time login - sending OTP');

      try {
        const newSignUp = await signUp?.create({
          emailAddress: email,
        });

        await signUp?.prepareEmailAddressVerification({
          strategy: 'email_code'
        });
        console.log('✅ OTP sent');
        setIsLoading(false);
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      } catch (signUpError: any) {
        console.error('Signup error:', signUpError);
        const errorCode = signUpError.errors?.[0]?.code;


        // User exists in Clerk, just resend OTP
        if (errorCode === 'form_identifier_exists') {
          console.log('User exists in Clerk, resending OTP');
          try {
            if (signUp && signUp.emailAddress === email) {
              await signUp.prepareEmailAddressVerification({
                strategy: 'email_code'
              });
              setIsLoading(false);
              router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
              return;
            }
          } catch (resendError) {
            console.error('Resend failed:', resendError);
          }
        }

        Alert.alert('Error', 'Unable to send verification code. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    // ========================================
    // STEP 3: Returning user → Need password
    // ========================================
    if (!password) {
      Alert.alert('Password Required', 'Please enter your password to sign in.');
      setIsLoading(false);
      return;
    }

    // Sign in with password
    console.log('🔐 Signing in with password...');
    try {
      const signInAttempt = await signIn?.create({
        identifier: email,
      });

      if (signInAttempt?.status === 'needs_first_factor') {
        const result = await signIn?.attemptFirstFactor({
          strategy: 'password',
          password: password,
        });

        if (result?.status === 'complete') {
          await setActive?.({ session: result.createdSessionId });

          // ========================================
          // STEP 4: Determine user type & route
          // ========================================
          const customer = {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            phone: existingUser.phone,
            profilePhoto: existingUser.profile_photo,
            customerNumber: existingUser.customer_number,
            role: userRole,
            paymentType: existingUser.payment_type,
            monthlyBalance: parseFloat(existingUser.monthly_balance) || 0,
            totalSpent: parseFloat(existingUser.total_spent) || 0,
            isFirstLogin: false,
            registeredAt: existingUser.registered_at,
          };

          let userType: 'customer' | 'receptionist' | 'admin';
          
          // 🆕 Support master_admin and admin roles
          if (userRole === 'master_admin' || userRole === 'admin') {
            userType = 'admin';
            console.log('✅ Logging in as ADMIN');
          } else if (userRole === 'receptionist') {
            userType = 'receptionist';
            console.log('✅ Logging in as RECEPTIONIST');
          } else {
            userType = 'customer';
            console.log('✅ Logging in as CUSTOMER');
          }

          authDispatch({
            type: 'LOGIN',
            userType: userType,
            user: customer
          });

          // Route to correct dashboard
          if (userType === 'admin') {
            router.replace('/(admin)');
          } else if (userType === 'receptionist') {
            router.replace('/(tabs)/reception-dashboard');
          } else {
            router.replace('/(tabs)');
          }

          console.log('✅ Login successful');
        }
      }
    } catch (signInError: any) {
      const errorCode = signInError.errors?.[0]?.code;
      const errorMessage = signInError.errors?.[0]?.message || '';

      if (errorCode === 'form_password_incorrect') {
        Alert.alert('Incorrect Password', 'The password you entered is incorrect.');
      } else if (errorCode === 'form_identifier_not_found') {
        Alert.alert('Error', 'Account not found in authentication system. Please contact admin.');
      } else {
        Alert.alert('Login Failed', errorMessage || 'Unable to sign in.');
      }
      setIsLoading(false);
      return;
    }

  } catch (error: any) {
    console.error('Login error:', error);
    Alert.alert('Error', 'An error occurred during login.');
  } finally {
    setIsLoading(false);
  }
};

  const handleBack = () => {
    router.back();
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Enter Email', 'Please enter your email address first');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // Navigate to forgot password screen
    router.push(`/forgot-password?email=${encodeURIComponent(email)}&portal=${portal}`);
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
    <Wrapper  onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView style={{ flex: 1 }}>
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
                  onChangeText={(text) => {
                    setEmail(text);
                    if (isCustomer) {
                      checkCustomerStatus(text);
                    }
                  }}
                  onBlur={() => {
                    if (isCustomer && email) {
                      checkCustomerStatus(email);
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {isCustomer && customerExists !== null && (
                <Text style={[
                  styles.helperText,
                  customerExists === false && styles.errorText,
                  customerExists === true && styles.successText
                ]}>
                  {customerExists === false && '⚠️ Account not found. Contact your admin.'}
                  {customerExists === true && isFirstLogin && '✅ Account found! You\'ll receive an OTP.'}
                  {customerExists === true && !isFirstLogin && '✅ Welcome back! Enter your password.'}
                </Text>
              )}

              {(!isCustomer || (isCustomer && customerExists && !isFirstLogin)) && (
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
              )}

              {/* Forgot Password Link */}
              {(!isCustomer || (isCustomer && customerExists && !isFirstLogin)) && (
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                >
                  <Text style={[styles.forgotPasswordText, { color: portalColor }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}

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
            </View>

            <View style={styles.footer}>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Wrapper >
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
    marginTop: -12,
    marginBottom: -8,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
  },
  successText: {
    color: '#10B981',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -12,
    marginBottom: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
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