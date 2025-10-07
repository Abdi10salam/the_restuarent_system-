import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { useSignUp, useClerk } from '@clerk/clerk-expo';
import { useAuth } from '../context/AuthContext';

export default function SetPasswordScreen() {
  const router = useRouter();
  const { state, setPassword } = useAuth();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();

  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!state.currentUser) {
      Alert.alert('Error', 'User session not found');
      return;
    }

    setIsLoading(true);

    try {
      // Update password in Clerk and activate session
      await signUp?.update({
        password: password,
      });

      // Now set the active session
      if (signUp?.createdSessionId) {
        await setActive?.({ session: signUp.createdSessionId });
      }

      // Update local state
      setPassword(state.currentUser.id, password);

      // Navigate to home
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Set password error:', err);
      Alert.alert(
        'Error',
        err.errors?.[0]?.message || 'Failed to set password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Lock size={40} color="#F97316" strokeWidth={2} />
        </View>
        <Text style={styles.title}>Set Your Password</Text>
        <Text style={styles.subtitle}>
          Welcome {state.currentUser?.name}! Please create a secure password for your account.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Lock size={20} color="#6B7280" strokeWidth={2} />
          <TextInput
            style={styles.input}
            placeholder="Create password"
            value={password}
            onChangeText={setPasswordValue}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color="#6B7280" strokeWidth={2} />
            ) : (
              <Eye size={20} color="#6B7280" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color="#6B7280" strokeWidth={2} />
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color="#6B7280" strokeWidth={2} />
            ) : (
              <Eye size={20} color="#6B7280" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.setPasswordButton, isLoading && styles.disabledButton]}
          onPress={handleSetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.setPasswordButtonText}>Set Password</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.requirements}>
        <Text style={styles.requirementsTitle}>Password Requirements:</Text>
        <Text style={styles.requirementText}>• At least 8 characters long</Text>
        <Text style={styles.requirementText}>• Must match confirmation</Text>
        <Text style={styles.requirementText}>• Use a strong, unique password</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    paddingTop: 80,
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
  eyeButton: {
    padding: 4,
  },
  setPasswordButton: {
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
  setPasswordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  requirements: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
});