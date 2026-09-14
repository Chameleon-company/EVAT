import React from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";

function NavigationInfo(props) {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { travelTime, travelDistance, cancelFunction } = props;

    const isDark = theme === "dark";

    return (
        <View
            style={[
                styles.infoBar,
                {
                    backgroundColor: "transparent",
                },
            ]}
        >
            <View
                style={[
                    styles.infoDisplays,
                    {
                        backgroundColor: isDark
                            ? "#08100c"
                            : "#ffffffcc",
                        borderColor: isDark
                            ? "#14532d"
                            : "#888888bb",
                    },
                ]}
            >
                <Text
                    style={[
                        styles.infoText,
                        {
                            color: isDark ? "#f5fff8" : "#000000",
                        },
                    ]}
                >
                    {travelTime} min
                </Text>
            </View>

            <View
                style={[
                    styles.infoDisplays,
                    {
                        backgroundColor: isDark
                            ? "#08100c"
                            : "#ffffffcc",
                        borderColor: isDark
                            ? "#14532d"
                            : "#888888bb",
                    },
                ]}
            >
                <Text
                    style={[
                        styles.infoText,
                        {
                            color: isDark ? "#f5fff8" : "#000000",
                        },
                    ]}
                >
                    {travelDistance} km
                </Text>
            </View>

            <TouchableOpacity
                style={[
                    styles.cancel,
                    {
                        backgroundColor: isDark
                            ? "#991b1b"
                            : "#ff0000cc",
                        borderColor: isDark
                            ? "#ef4444"
                            : "#888888bb",
                    },
                ]}
                onPress={cancelFunction}
            >
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    infoBar: {
        zIndex: 100,
        width: 60,
        height: Dimensions.get("window").height / 10,
        position: "absolute",
        flexDirection: "column",
        bottom: "30%",
        right: 10,
        alignItems: "center",
        margin: 0,
        padding: 0,
    },

    infoDisplays: {
        width: 60,
        height: 60,
        borderRadius: 60,
        marginBottom: 10,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },

    infoText: {
        fontSize: 14,
        fontWeight: "bold",
    },

    cancel: {
        width: 60,
        height: 60,
        borderRadius: 60,
        marginBottom: 10,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },

    cancelText: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
    },
});

export default NavigationInfo;