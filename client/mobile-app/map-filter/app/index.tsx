import React, { useState } from 'react';
import { StyleSheet, Button, Modal, Text,TextInput, View, Pressable, TouchableOpacity, TouchableWithoutFeedback, StyleProp, ViewStyle, TextStyle, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
interface ToggleButtonProps {
  label: string;
  name: string;
  onToggle: (name: string, toggled: boolean) => void;
  style?: StyleProp<ViewStyle>;
}
const ToggleButton: React.FC<ToggleButtonProps> = ({ label, onToggle, style }) => {
  const [toggled, setToggled] = useState(false);

  const handlePress = () => {
    setToggled(!toggled);
    onToggle(label, !toggled);
  };
return (
    <TouchableOpacity
      style={[styles.toggleButton, style, 
        { backgroundColor: toggled ? '#2AB4DF' : '#2AB4DF',
          borderColor: toggled ? 'green' : '#2AB4DF',
         }]}
      onPress={handlePress}
    >
    <Text style={[styles.toggleButtonText, { color: toggled ? 'green' : 'white' }]}>
      {label}
    </Text>
    </TouchableOpacity>
  );
};  
type MyCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  buttonStyle?: object;
  activeButtonStyle?: object;
  inactiveButtonStyle?: object;
  activeIconProps?: object;
  inactiveIconProps?: object;
};

function MyCheckbox({
  checked,
  onChange,
  buttonStyle = {},
  activeButtonStyle = {},
  inactiveButtonStyle = {},
  activeIconProps = {},
  inactiveIconProps = {},
}: MyCheckboxProps) {
  const iconProps = checked ? activeIconProps : inactiveIconProps;
  return (
    <Pressable
      style={[
        buttonStyle,
        checked
          ? activeButtonStyle
          : inactiveButtonStyle,
      ]}
      onPress={() => onChange(!checked)}>
      {checked && (
        <Ionicons
          name="checkmark"
          size={24}
          color="white"
          {...iconProps}
        />
      )}
    </Pressable>
  );
}

export default function App() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalVisible, setModalVisible] = useState<string | null>(null);

  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);

  const handleToggle = (name: string, toggled: boolean) => {
    console.log(`${name} toggled: ${toggled}`);
  };

  const toggleModal = (type: string | null) => {
    setModalVisible(type);
  };

  const handleOverlayPress = () => {
    setModalVisible(null);
  };
  const handleOpenModal = (content: string) => {
    setModalContent(content);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  return (
    <ScrollView style={styles.scrollView}>
    <View style={styles.appContainer}></View>
      <Text style={styles.additionalFilters}>Additional Filters</Text>
      <ToggleButton label="Hide Tesla Only Location" name="HideTeslaOnlyLocation" onToggle={handleToggle} style={{ width: 220, height: 37, position: 'absolute', left: 87, top: 1095 }} />
      <ToggleButton label="Private Home" name="PrivateHome" onToggle={handleToggle} style={{ width: 125, height: 37, position: 'absolute', left: 58, top: 1148 }} />
      <ToggleButton label="Available Now" name="AvailableNow" onToggle={handleToggle} style={{ width: 140, height: 37, position: 'absolute', left: 195, top: 1148 }} />
      <ToggleButton label="Hide Dealerships" name="HideDealerships" onToggle={handleToggle} style={{ width: 155, height: 37, position: 'absolute', left: 12, top: 1201 }} />
      <ToggleButton label="Hide Restricted Access" name="HideRestrictedAccess" onToggle={handleToggle} style={{ width: 202, height: 37, position: 'absolute', left: 179, top: 1201 }} />

      <Text style={styles.parking}>Parking</Text>
      <ToggleButton label="Accessible" name="Accessible" onToggle={handleToggle} style={{ width: 145, height: 37, position: 'absolute', left: 44, top: 1312 }} />
      <ToggleButton label="Pull In" name="PullIn" onToggle={handleToggle} style={{ width: 145, height: 37, position: 'absolute', left: 204, top: 1312 }} />
      <ToggleButton label="Trailer Friendly" name="TrailerFriendly" onToggle={handleToggle} style={{ width: 145, height: 37, position: 'absolute', left: 44, top: 1370 }} />
      <ToggleButton label="Pull Through" name="PullThrough" onToggle={handleToggle} style={{ width: 145, height: 37, position: 'absolute', left: 204, top: 1370 }} />

      <Text style={styles.comingSoon}>Coming Soon</Text>
      <Text style={styles.includeComingSoon}>Include Coming Soon</Text>

      <MyCheckbox
          checked={checked1}
          onChange={setChecked1}
          buttonStyle={styles.checkboxBase}
          activeButtonStyle={styles.checkboxChecked}
        />
      <View style={styles.line} />


      <Text style={styles.showOnlyComingSoon}>Show Only Coming Soon</Text>
  
      <MyCheckbox
          checked={checked2}
          onChange={setChecked2}
          buttonStyle={styles.checkboxBase2}
          activeButtonStyle={styles.checkboxChecked2}
        />
      <View style={styles.line2} />
    

      <Text style={styles.hideComingSoon}>Hide Coming Soon</Text>
      <MyCheckbox
          checked={checked3}
          onChange={setChecked3}
          buttonStyle={styles.checkboxBase3}
          activeButtonStyle={styles.checkboxChecked3}
        />
        
      <View style={styles.line3} />
      

      <Text style={styles.networksAndCountry}>Networks and Country</Text>
      <View style={styles.rectangle62} />
      <View style={styles.line4} />
      
      <Text style={styles.networks}>Networks</Text>
      <TouchableOpacity onPress={() => toggleModal('all')}style={styles.button}>
        <Text style={styles.all}>All</Text>
       </TouchableOpacity>
      {/* Modal for "All" */}
      <Modal
        transparent={true}
        visible={modalVisible === 'all'}
        onRequestClose={() => toggleModal(null)}
        animationType="fade"
        style={{ zIndex: 10 }} 
      >
      <Pressable style={styles.modalOverlay} onPress={handleOverlayPress}>
                <View style={styles.modalContainerAll}>
                  <View style={styles.modalContent}>
                    <TextInput style={styles.searchInput} placeholder="Search Networks" />
                    <View style={styles.buttonContainer}></View>
                    <Button title="All" onPress={() => {}} />
                    <Button title="ChargePoint" onPress={() => {}} />
                    <Button title="EV Connect" onPress={() => {}} />
                    <Button title="Lumo Energy" onPress={() => {}} />
                    <Button title="Tesla Supercharger" onPress={() => {}} />
                  </View>
                </View>
              </Pressable>
            </Modal>

      <Text style={styles.country}>Country</Text>
      <TouchableOpacity onPress={() => toggleModal('currentLocation')}style={styles.button}>
        <Text style={styles.currentLocation}>Current Location </Text>
      </TouchableOpacity>
      {/* Modal for "Current Location" */}
      <Modal
        transparent={true}
        visible={modalVisible === 'currentLocation'}
        onRequestClose={() => toggleModal(null)}
        animationType="fade"
        style={{ zIndex: 10 }} 
      >
        <Pressable style={styles.modalOverlay} onPress={handleOverlayPress}>
          <View style={styles.modalContainerLocation}>
            <View style={styles.modalContent}>
              <TextInput style={styles.searchInput} placeholder="Search Location..." />
              <View style={styles.buttonContainer}></View>
              <Button title="Current Location" onPress={() => {}} />
              <Button title="ACT" onPress={() => {}} />
              <Button title="NSW" onPress={() => {}} />
              <Button title="NT" onPress={() => {}} />
              <Button title="QLD" onPress={() => {}} />
              <Button title="SA" onPress={() => {}} />
              <Button title="TAS" onPress={() => {}} />
              <Button title="VIC" onPress={() => {}} />
              <Button title="WA" onPress={() => {}} />
            </View>
          </View>
        </Pressable>
      </Modal>

      <Text style={styles.matchingResultFound}>66 Matching Result Found</Text>
      <ToggleButton label="View" name="View" onToggle={handleToggle} style={{ width: 65,height: 30, position: 'absolute',top: 1832,left: 321,zIndex: 2, }} />
    </ScrollView>

  );
}

const styles = StyleSheet.create({
  appContainer: {
    width: 393, height: 1871, position: 'relative',
    backgroundColor: '#CFF9FF',
   
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  appTitle: {
    marginVertical: 16,
    fontWeight: 'bold',
    fontSize: 24,
  },
  scrollView: {
    flexGrow: 1,
  },
  additionalFilters: {
    width: 191,
    height: 20,
    textAlign: 'center',
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
    position: 'absolute',
    left: 100,
    top: 1056,
  },
  parking:{
    width: 171, 
    height: 20, 
    left: 110, 
    top: 1271,
    textAlign: 'center',
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
    position: 'absolute',
  },
  toggleButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  comingSoon: {
    width: 191,
    height: 20,
    left: 102,
    top: 1449,
    position: 'absolute',
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 0.79)',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  includeComingSoon: {
    position: 'absolute',
    height: 20,
    left: 22,
    top: 1489,
    textAlign: 'center',
    color: '#2AB4DF',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  checkboxBase: {
    width: 24,
    height: 24,
    left: 315,
    top: 1482,
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2AB4DF',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#2AB4DF',
  },
  line: {
    width: 350,
    height: 0,
    left:20,
    position: 'absolute',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.16)',
    top: 1508,
  },
  showOnlyComingSoon: {
    position: 'absolute',
    left: 22,
    top: 1539,
    textAlign: 'center',
    color: '#2AB4DF',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  checkboxBase2: {
    width: 24,
    height: 24,
    left: 315,
    top: 1532,
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2AB4DF',
    backgroundColor: 'transparent',
  },
  checkboxChecked2: {
    backgroundColor: '#2AB4DF',
  },
  line2: {
    width: 350,
    height: 0,
    left:20,
    position: 'absolute',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.16)',
    top: 1558,
  },
  hideComingSoon: {
    position: 'absolute',
    left: 22,
    top: 1589,
    textAlign: 'center',
    color: '#2AB4DF',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  checkboxBase3: {
    width: 24,
    height: 24,
    left: 315,
    top: 1582,
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2AB4DF',
    backgroundColor: 'transparent',
  },
  checkboxChecked3: {
    backgroundColor: '#2AB4DF',
  },
  line3: {
    width: 350,
    height: 0,
    left:20,
    position: 'absolute',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.16)',
    top: 1608,
  },
  networksAndCountry: {
    width: 191,
    height: 20,
    left: 102,
    top: 1628,
    position: 'absolute',
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 0.79)',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  rectangle62: {
    width: 350,
    height: 84,
    left: 23,
    top: 1669,
    position: 'absolute',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(170, 170, 170, 0.67)',
    backgroundColor: 'transparent',
  },
  line4: {
    width: 350,
    height: 0,
    position: 'absolute',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.16)',
    left: 23,
    top: 1711,
  },
  networks: {
    width: 80,
    height: 25,
    left: 39,
    top: 1679,
    position: 'absolute',
    textAlign: 'center',
    color: '#2AB4DF',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  all: {
    width: 40,
    height: 25,
    position: 'absolute',
    left: 315,
    top: 1680,
    textAlign: 'center',
    color: '#2AB4DF',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
    zIndex: 20,
  },
  country: {
    width: 70,
    height: 25,
    left: 39,
    top: 1720,
    position: 'absolute',
    textAlign: 'center',
    color: '#2AB4DF',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  currentLocation: {
    width: 160,
    height: 25,
    left: 200,
    top: 1720,
    position: 'absolute',
    textAlign: 'center',
    color: '#2AB4DF',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button:{
    width: 304,
    height: 257,
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2AB4DF',
    padding: 20,
    elevation: 10,
  },
  modalContainerAll: {
    width: 250,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'white',
    borderColor: '#2AB4DF',
    padding: 20,
    elevation: 10,
  },
  modalContainerLocation: {
    width: 240,
    height: 420,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2AB4DF',
    padding: 20,
    elevation: 10,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  searchInput: {
    width: '100%',
    height: 40,
    borderColor: '#2AB4DF',
    backgroundColor: '#2AB4DF',
    color: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  matchingResultFound: {
    width: 150,
    height: 25,
    textAlign: 'center',
    color: '#2AB4DF',
    left: 12,
    top: 1832,
    position: 'absolute',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
});

