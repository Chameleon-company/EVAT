import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

const apiUrl = 'https://evat.vt2.app/api/navigation/getchargersnode';

type SearchModalProps = {
  visible: boolean;
  onClose: () => void;
  onResults: (results: any[]) => void;
  dataIn: {
    name?: string;
    lat?: number;
    lon?: number;
    radius?: number;
    connector?: string;
    current?: string;
    operator?: string;
  }
};

const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose, onResults, dataIn }) => {
  const [name, setName] = React.useState(dataIn?.name);
  const [radius, setRadius] = React.useState(dataIn?.radius);
  const [connector, setConnector] = React.useState(dataIn?.connector);
  const [current, setCurrent] = React.useState(dataIn?.current);
  const [operator, setOperator] = React.useState(dataIn?.operator);

  const [lat, setLat] = React.useState('');
  const [lon, setLon] = React.useState('');

  useEffect(() => {
    // Update the lat and lon state variables when the charger prop changes
    if (visible && dataIn) {
      setLat(dataIn.lat.toString() || '');
      setLon(dataIn.lon.toString() || '');
    }
  }, [visible, dataIn]);

  const handleSearch = async () => {
    console.log(connector, current, operator);
    const results = { lat, lon, radius }
    if (connector != undefined) { results.connector = connector };
    if (current != undefined) { results.current = current };
    if (operator != undefined) { results.operator = operator };
    onResults(results);
  };

  return (
    <Modal key={18} visible={visible} transparent animationType="slide">
      <View key={16} style={styles.modalContainer}>
        <Text key={1} style={styles.title}>Search Chargers</Text>
        <Text key={20} style={styles.inputTitle}>Name:</Text>
        <TextInput key={2} keyboardType="numeric" style={styles.input} placeholder="Name" value={name} onChangeText={setName} />

        <Text key={21} style={styles.inputTitle}>Latitude:</Text>
        <TextInput key={3} keyboardType="numeric" style={styles.input} placeholder="Latitude" value={lat} onChangeText={setLat} />
        <Text key={22} style={styles.inputTitle}>Longitude:</Text>
        <TextInput key={19} keyboardType="numeric" style={styles.input} placeholder="Longitude" value={lon} onChangeText={setLon} />
        <Text key={23} style={styles.inputTitle}>Radius:</Text>
        <TextInput key={4} keyboardType="numeric" style={styles.input} placeholder="Radius (km)" value={radius} onChangeText={setRadius} keyboardType="numeric" />

        <Picker key={5} selectedValue={connector} onValueChange={setConnector} style={pickerSelectStyles.inputAndroid}>
          <Picker.Item key={36} label="Select Connector" value="" />
          <Picker.Item key={37} label="CCS (Type 2)" value="CCS (Type 2)" />
          <Picker.Item key={38} label="CHAdeMO" value="CHAdeMO" />
          <Picker.Item key={39} label="IEC 60309 5-pin" value="IEC 60309 5-pin" />
          <Picker.Item key={30} label="NEMA 5-20R" value="NEMA 5-20R" />
          <Picker.Item key={31} label="Tesla (Model S/X)" value="Tesla (Model S/X)" />
          <Picker.Item key={32} label="Three Phase 5-Pin (AS/NZ 3123)" value="Three Phase 5-Pin (AS/NZ 3123)" />
          <Picker.Item key={33} label="Type 1 (J1772)" value="Type 1 (J1772)" />
          <Picker.Item key={34} label="Type 1 (J1772), Type 2 (Socket Only), CHAdeMO" value="Type 1 (J1772), Type 2 (Socket Only), CHAdeMO" />
          <Picker.Item key={35} label="Type 2 (Socket Only)" value="Type 2 (Socket Only)" />
          <Picker.Item key={46} label="Type 2 (Socket Only), CHAdeMO" value="Type 2 (Socket Only), CHAdeMO" />
          <Picker.Item key={47} label="Type 2 (Tethered Connector)" value="Type 2 (Tethered Connector) " />
          <Picker.Item key={48} label="Type I (AS 3112)" value="Type I (AS 3112)" />
          <Picker.Item key={49} label="Unknown" value="Unknown" />
        </Picker>

        <Picker key={9} selectedValue={current} onValueChange={setCurrent} style={pickerSelectStyles.inputAndroid}>
          <Picker.Item key={10} label="Select Current" value="" />
          <Picker.Item key={11} label="AC Single Phase" value="AC (Single-Phase)" />
          <Picker.Item key={12} label="AC Three Phase" value="AC (Three-Phase)" />
          <Picker.Item key={50} label="DC" value="DC" />
        </Picker>
        <Text key={24} style={styles.inputTitle}>Operator:</Text>
        <TextInput key={13} style={styles.input} placeholder="Operator" value={operator} onChangeText={setOperator} />

        <View key={17} style={styles.buttonContainer}>
          <Button key={14} title="Search" onPress={handleSearch} color="lightgreen" />
          <Button key={15} title="Cancel" onPress={onClose} color="lightgreen" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    marginTop: '25%',
    marginHorizontal: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    color: 'black',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: 'black',
  },
  inputTitle: {
    fontSize: 16,
    textAlign: 'left',
    color: 'black',
    width: '25%',
    flexDirection: 'row'
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    padding: 8,
    color: 'black',
    // width: '55%',
    flexDirection: 'row',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    color: 'black',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputAndroid: {
    height: 50,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    paddingHorizontal: 8,
    color: 'black'
  },
});

export default SearchModal;
