import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme/theme';

interface CircularProgressProps {
  size: number;
  progress: number; // 0 to 1
  strokeWidth?: number;
  progressColor?: string; // Add support for custom progress color
}

const CircularProgress = ({ 
  size, 
  progress, 
  strokeWidth = 3,
  progressColor = colors.primary // Default to primary color
}: CircularProgressProps) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const isComplete = progress >= 1;

  // Checkmark path calculation
  const checkmarkSize = size * 0.5; // Checkmark size relative to circle
  const checkmarkPath = `M${center - checkmarkSize/3},${center} l${checkmarkSize/3},${checkmarkSize/3} l${checkmarkSize/2},-${checkmarkSize/2}`;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.background}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {!isComplete && (
          /* Progress circle */
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}

        {isComplete && (
          <>
            {/* Completed circle background */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              fill={progressColor}
            />
            {/* Checkmark */}
            <Path
              d={checkmarkPath}
              stroke="white"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CircularProgress; 