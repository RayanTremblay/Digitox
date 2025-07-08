export const colors = {
  primary: '#6C63FF',
  primaryDark: '#5A52E5',
  background: '#1A1B1E',
  surface: 'rgba(255, 255, 255, 0.1)',
  surfaceLight: 'rgba(255, 255, 255, 0.15)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  accent: '#6C63FF',
  error: '#FF5252',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#2196F3',
  white: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.2)',
};

type FontWeight = '400' | '500' | '600' | '700' | 'normal' | 'bold';

export const typography = {
  logo: {
    fontSize: 40,
    fontFamily: 'Maitree_700Bold',
    color: colors.text,
    letterSpacing: 0.5,
    lineHeight: 48,
  },
  h1: {
    fontSize: 32,
    fontFamily: 'Maitree_700Bold',
    fontWeight: '700' as FontWeight,
    color: colors.text,
    letterSpacing: 0.25,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontFamily: 'Maitree_600SemiBold',
    fontWeight: '600' as FontWeight,
    color: colors.text,
    letterSpacing: 0,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontFamily: 'Maitree_600SemiBold',
    fontWeight: '600' as FontWeight,
    color: colors.text,
    letterSpacing: 0.15,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Maitree_400Regular',
    color: colors.text,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontFamily: 'Maitree_400Regular',
    color: colors.textSecondary,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  button: {
    fontSize: 16,
    fontFamily: 'Maitree_600SemiBold',
    fontWeight: '600' as FontWeight,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  h4: {
    fontSize: 18,
    fontFamily: 'Maitree_600SemiBold',
    fontWeight: '600' as FontWeight,
    color: colors.text,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
}; 