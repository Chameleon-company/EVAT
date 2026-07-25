import React, { useContext } from "react";
import { UserContext } from "../context/user.context";
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image, Alert } from "react-native";
import { useNavigation } from '@react-navigation/native';

function NavigationInfo(props) {
    const navigation = useNavigation();
    const { travelTime, travelDistance, cancelFunction } = props;

    return (
        <View style={styles.infoBar}>
            <View style={styles.infoDisplays}>
                <Text style={styles.infoText}>{travelTime} min</Text>
            </View>
            <View style={styles.infoDisplays}>
                <Text style={styles.infoText}>{travelDistance} km</Text>
            </View>
            <TouchableOpacity style={styles.cancel} onPress={cancelFunction}>
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
        </View >
    );
}

const styles = StyleSheet.create({
    infoBar: {
        zIndex: 100,
        width: 60,
        height: Dimensions.get('window').height / 10,
        position: 'absolute',
        flexDirection: 'column',
        bottom: "30%",
        right: 10,
        color: 'white',
        textAlign: 'center',
        alignItems: 'center',
        margin: 0,
        padding: 0,
    },
    infoDisplays: {
        width: 60,
        height: 60,
        borderRadius: 60,
        backgroundColor: '#ffffffcc',
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#888888bb',
        borderWidth: 1,
    },
    infoText: {
        color: 'black',
        fontSize: 14,
        fontWeight: 'bold',
    },
    cancel: {
        width: 60,
        height: 60,
        borderRadius: 60,
        backgroundColor: '#ff0000cc',
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#888888bb',
        borderWidth: 1,
        fontColor: 'white',
    },
    cancelText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
})

export default NavigationInfo;