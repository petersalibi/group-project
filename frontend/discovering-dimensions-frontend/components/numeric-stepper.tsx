import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Or your icon library
import { ThemedText } from './themed-text';

interface NumericStepperProps {
  value: number;
  onChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  enabled?: boolean;
}

export function NumericStepper({
    value,
    onChange,
    minValue = 0,
    maxValue = 100,
    step = 1,
    enabled = true,
}: NumericStepperProps) {

    const [textValue, setTextValue] = useState(String(value));
    useEffect(() => {
        setTextValue(String(value));
    }, [value]);
  
    const handleIncrement = () => {
        if (value + step <= maxValue) {
            onChange(value + step);
        }
    };

    const handleDecrement = () => {
        if (value - step >= minValue) {
        onChange(value - step);
        }
    };

    const handleChangeText = (text: string) => {
        // Allow empty string to let user delete everything to type a new number
        if (text === '') {
        setTextValue('');
        return;
        }

        // Only allow numeric input
        const numericRegex = /^[0-9]*$/;
        if (numericRegex.test(text)) {
            setTextValue(text);
            // const num = parseInt(text, 10);
            // if (!isNaN(num)) onChange(num); 
        }
    };

    const handleBlur = () => {
        let num = parseInt(textValue, 10);

        if (isNaN(num)) {
        num = minValue;
        } else if (num < minValue) {
        num = minValue;
        } else if (num > maxValue) {
        num = maxValue;
        }

        // Update parent and reset local text to the valid number
        onChange(num);
        setTextValue(String(num));
    };

    return (
        <View style={[styles.container, !enabled && styles.disabledContainer]}>
        <TouchableOpacity 
            onPress={handleDecrement} 
            style={[styles.button, !enabled && styles.disabledButton]}
            activeOpacity={enabled ? 0.7 : 1}
            disabled={!enabled}
        >
            <Ionicons name="remove" size={20} color="white" />
        </TouchableOpacity>

        <View style={styles.valueContainer}>
            <TextInput
                style={[styles.input, !enabled && styles.disabledInput]}
                value={textValue}
                onChangeText={handleChangeText}
                onBlur={handleBlur}
                onSubmitEditing={handleBlur}
                keyboardType="numeric"
                textAlign="center"
                cursorColor="white" // Android only
                selectionColor="rgba(255,255,255,0.4)"
                editable={enabled}
            />
        </View>

        <TouchableOpacity 
            onPress={handleIncrement} 
            style={[styles.button, !enabled && styles.disabledButton]}
            activeOpacity={enabled ? 0.7 : 1}
            disabled={!enabled}
        >
            <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 5,
        overflow: 'hidden',
    },
    button: {
        padding: 8,
        backgroundColor: '#00aaff',
        alignItems: 'center',
        justifyContent: 'center',
        width: 35,
        zIndex: 10,    // Forces button to sit visually "above" the input
        elevation: 5,
    },
    valueContainer: {
        width: 40,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    valueText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    input: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        height: '100%',
        padding: 0, // Removes default padding on Android
        textAlign: 'center',
        ...Platform.select({
        web: { outlineStyle: 'none' } as any, // Hides blue outline on Web
        }),
    },
    disabledContainer: {
        opacity: 0.6, 
        backgroundColor: '#252525', 
    },
    disabledButton: {
        backgroundColor: '#444',
    },
    disabledInput: {
        color: '#aaa',
    },
});