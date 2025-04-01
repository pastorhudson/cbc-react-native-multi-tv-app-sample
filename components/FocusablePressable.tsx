import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { SpatialNavigationFocusableView } from 'react-tv-space-navigation';
import { scaledPixels } from '@/utils/scaling';

interface FocusablePressableProps {
  text: string;
  onSelect: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const FocusablePressable: React.FC<FocusablePressableProps> = ({
                                                                 text,
                                                                 onSelect,
                                                                 style,
                                                                 textStyle,
                                                                 disabled = false,
                                                               }) => {
  const [pressed, setPressed] = useState(false);
  const styles = useStyles();

  // If disabled, we can use a wrapper that doesn't pass the onSelect
  return (
    <SpatialNavigationFocusableView
      onSelect={disabled ? undefined : onSelect}
    >
      {({ isFocused }) => (
        <Pressable
          onPress={disabled ? undefined : onSelect}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={[
            styles.button,
            isFocused && styles.focused,
            pressed && styles.pressed,
            disabled && styles.disabled,
            style,
          ]}
          disabled={disabled}
        >
          <Text style={[styles.text, isFocused && styles.focusedText, textStyle]}>{text}</Text>
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  );
};

const useStyles = () => {
  return StyleSheet.create({
    button: {
      paddingVertical: scaledPixels(12),
      paddingHorizontal: scaledPixels(24),
      borderRadius: scaledPixels(6),
      backgroundColor: '#333',
      alignItems: 'center',
      justifyContent: 'center',
    },
    focused: {
      backgroundColor: '#0078D7',
    },
    pressed: {
      opacity: 0.8,
    },
    disabled: {
      backgroundColor: '#555',
      opacity: 0.5,
    },
    text: {
      color: '#fff',
      fontSize: scaledPixels(18),
      fontWeight: '500',
    },
    focusedText: {
      fontWeight: 'bold',
    },
  });
};

export default FocusablePressable;