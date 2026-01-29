// app/components/ReceiptModal.tsx
// Modal that appears after order completion to print receipt

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Printer, X, FileText, CheckCircle } from 'lucide-react-native';
import { Order } from './../types';
import { printReceipt } from '../app/lib/print-service';
import { generateReceiptText } from '../app/lib/receipt-generator';
import { formatCurrency } from '../utils/currency';

interface ReceiptModalProps {
  visible: boolean;
  order: Order | null;
  servedBy: string;
  onClose: () => void;
}

export function ReceiptModal({ visible, order, servedBy, onClose }: ReceiptModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!order) return null;

  const handlePrint = async () => {
    setIsPrinting(true);

    try {
      const result = await printReceipt(order, servedBy);

      if (result.success) {
        Alert.alert(
          'Receipt Printed! ✅',
          'Receipt has been sent to the printer successfully.',
          [
            {
              text: 'Print Another',
              onPress: () => {
                setIsPrinting(false);
                // Modal stays open for reprinting
              },
            },
            {
              text: 'Done',
              onPress: () => {
                setIsPrinting(false);
                onClose();
              },
            },
          ]
        );
      } else {
        // Print failed - show retry option
        Alert.alert(
          'Print Failed',
          result.error || 'Could not print receipt. Please try again.',
          [
            {
              text: 'Retry',
              onPress: () => {
                setIsPrinting(false);
                setTimeout(() => handlePrint(), 100);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsPrinting(false),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Print error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK', onPress: () => setIsPrinting(false) }]
      );
    }
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  const receiptText = generateReceiptText(order, servedBy);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <CheckCircle size={24} color="#10B981" strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.title}>Order Complete!</Text>
                <Text style={styles.subtitle}>Order #{order.id.slice(-6)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items:</Text>
              <Text style={styles.summaryValue}>{order.items.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total:</Text>
              <Text style={styles.summaryValueBold}>{formatCurrency(order.totalAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Served by:</Text>
              <Text style={styles.summaryValue}>{servedBy}</Text>
            </View>
          </View>

          {/* Preview Section */}
          {showPreview && (
            <ScrollView style={styles.previewContainer}>
              <Text style={styles.previewText}>{receiptText}</Text>
            </ScrollView>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={handlePreview}
              disabled={isPrinting}
            >
              <FileText size={20} color="#6B7280" strokeWidth={2} />
              <Text style={styles.previewButtonText}>
                {showPreview ? 'Hide Preview' : 'Preview Receipt'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.printButton, isPrinting && styles.disabledButton]}
              onPress={handlePrint}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.printButtonText}>Printing...</Text>
                </>
              ) : (
                <>
                  <Printer size={20} color="#fff" strokeWidth={2} />
                  <Text style={styles.printButtonText}>Print Receipt</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
              disabled={isPrinting}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  previewContainer: {
    maxHeight: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#1F2937',
    lineHeight: 16,
  },
  actions: {
    gap: 12,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#10B981',
    gap: 8,
  },
  printButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  disabledButton: {
    opacity: 0.6,
  },
});