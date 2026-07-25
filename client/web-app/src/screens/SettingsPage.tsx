import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Button,
  TextInput,
  Image,
  FlatList,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../context/user.context';

interface Vehicle {
  id: string;
  name: string;
  plate: string;
}

const SettingsPage: React.FC = () => {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    user?.selectedVehicleId || ''
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>(user?.vehicles || []);

  const [newVehicleName, setNewVehicleName] = useState<string>('');
  const [newPlate, setNewPlate] = useState<string>('');

  const handleAddVehicle = () => {
    if (!newVehicleName || !newPlate) {
      Alert.alert('❗ Missing info', 'Please enter both vehicle name and number plate.');
      return;
    }

    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      name: newVehicleName,
      plate: newPlate,
    };

    const updatedVehicles = [...vehicles, newVehicle];
    setVehicles(updatedVehicles);
    setSelectedVehicleId(newVehicle.id);

    if (setUser) {
      setUser({ ...user, vehicles: updatedVehicles, selectedVehicleId: newVehicle.id });
    }

    setNewVehicleName('');
    setNewPlate('');
    Alert.alert('✅ Vehicle Added');
  };

  const handleSave = () => {
    if (setUser) {
      setUser({ ...user, selectedVehicleId });
    }
    Alert.alert('✅ Vehicle Selection Saved');
    navigation.goBack();
  };

  const getSelectedVehicle = () => vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileSection}>
        <Image
          source={
            user?.profilePicture
              ? { uri: user.profilePicture }
              : require('../data/default-profile.png')
          }
          style={styles.profileImage}
        />
        <View>
          <Text style={styles.profileName}>
            {user?.fullName}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
      </View>

      {/* Vehicle Picker */}
      <Text style={styles.label}>Your Vehicles:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedVehicleId}
          onValueChange={(itemValue) => setSelectedVehicleId(itemValue)}
          style={styles.picker}
        >
          {vehicles.map((vehicle) => (
            <Picker.Item
              key={vehicle.id}
              label={`${vehicle.name} (${vehicle.plate})`}
              value={vehicle.id}
            />
          ))}
        </Picker>
      </View>

      {/* Add Vehicle Section */}
      <Text style={styles.label}>Add New Vehicle:</Text>
      <TextInput
        style={styles.input}
        placeholder="Vehicle Name"
        value={newVehicleName}
        onChangeText={setNewVehicleName}
      />
      <TextInput
        style={styles.input}
        placeholder="Number Plate"
        value={newPlate}
        onChangeText={setNewPlate}
      />
      <Button title="Add Vehicle" onPress={handleAddVehicle} color="#4CAF50" />

      <View style={styles.divider} />

      <Button title="Save Selection" onPress={handleSave} color="#2196F3" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: 'gray',
  },

  label: { fontSize: 18, marginTop: 10, marginBottom: 5 },
  pickerContainer: {
    borderColor: '#ccc',
    borderWidth: Platform.OS === 'android' ? 0 : 1,
    borderRadius: 10,
    marginBottom: 20,
  },
  picker: {
    height: 50,
    width: '100%',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  divider: {
    marginVertical: 20,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
});

export default SettingsPage;
