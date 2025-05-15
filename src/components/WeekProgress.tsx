import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme/theme';
import CircularProgress from './CircularProgress';

interface WeekProgressProps {
  dailyGoal: number; // in minutes
  weekData: {
    day: string;
    timeSpent: number; // in minutes
  }[];
}

const WeekProgress = ({ dailyGoal, weekData }: WeekProgressProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        {weekData.map((day, index) => (
          <View key={day.day} style={styles.dayContainer}>
            <CircularProgress
              size={40}
              progress={Math.min(day.timeSpent / dailyGoal, 1)}
              strokeWidth={4}
            />
            <Text style={styles.dayLabel}>{day.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default WeekProgress; 