import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, TextInput, StyleSheet, Alert } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import Tesseract from 'tesseract.js';
import { PERMISSIONS, request, check, RESULTS } from 'react-native-permissions';

const CheckScanner = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    accountHolderName: '',
  });
  const [cameraPermission, setCameraPermission] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const status = await check(PERMISSIONS.IOS.CAMERA);
      if (status === RESULTS.GRANTED) {
        setCameraPermission(true);
      }
    };
    checkPermissions();
  }, []);

  const requestCameraPermission = async () => {
    const result = await request(PERMISSIONS.IOS.CAMERA);
    console.log('Camera Permission Result:', result);
    if (result === RESULTS.GRANTED) {
      setCameraPermission(true);
      Alert.alert('Permission Granted', 'You can now access the camera!');
    } else {
      Alert.alert('Permission Denied', 'Camera access is required to scan checks.');
    }
  };

  const scanCheck = async () => {
    if (!cameraPermission) {
      Alert.alert('Camera Permission Required', 'Please allow camera access to proceed.');
      return;
    }

    const result = await launchCamera({ mediaType: 'photo' });
    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImageUri(uri);

      // OCR Processing
      Tesseract.recognize(uri || '', 'eng')
        .then(({ data: { text } }) => {
          console.log('OCR Result:', text);
          const accountNumber = text.match(/\d{9,18}/)?.[0] || '';
          const ifscCode = text.match(/[A-Z]{4}0[A-Z0-9]{6}/)?.[0] || '';
          const bankName = 'Extract Bank Name Logic'; // Add your parsing logic
          const accountHolderName = 'Extract Account Holder Logic'; // Add your parsing logic

          setFormData({ accountNumber, bankName, ifscCode, accountHolderName });
        })
        .catch(err => console.error('OCR Error:', err));
    } else {
      Alert.alert('Camera Error', 'Could not capture image.');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const submitForm = () => {
    console.log('Final Data:', formData);
    Alert.alert('Form Submitted', 'Details have been processed successfully.');
  };

  return (
    <View style={styles.container}>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      {!cameraPermission && <Button title="Grant Camera Permission" onPress={requestCameraPermission} />}
      <Button title="Scan Check" onPress={scanCheck} />

      <Text style={styles.label}>Account Number:</Text>
      <TextInput
        style={styles.input}
        value={formData.accountNumber}
        onChangeText={value => updateField('accountNumber', value)}
      />

      <Text style={styles.label}>Bank Name:</Text>
      <TextInput
        style={styles.input}
        value={formData.bankName}
        onChangeText={value => updateField('bankName', value)}
      />

      <Text style={styles.label}>IFSC Code:</Text>
      <TextInput
        style={styles.input}
        value={formData.ifscCode}
        onChangeText={value => updateField('ifscCode', value)}
      />

      <Text style={styles.label}>Account Holder Name:</Text>
      <TextInput
        style={styles.input}
        value={formData.accountHolderName}
        onChangeText={value => updateField('accountHolderName', value)}
      />

      <Button title="Submit" onPress={submitForm} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
});

export default CheckScanner;
