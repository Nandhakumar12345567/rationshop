import { colors } from './colors';

export const theme = {
  colors,
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,   // Standard card radius for formal government look
    lg: 12,
    xl: 16,
    full: 9999
  },
  typography: {
    fontFamily: 'System',
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.navyPrimary
    },
    body: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textPrimary
    },
    caption: {
      fontSize: 11,
      fontWeight: '400',
      color: colors.textSecondary
    }
  },
  shadows: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2
    },
    header: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4
    }
  }
};

export const getCategoryBadgeStyle = (category) => {
  switch (category) {
    case 'Antyodaya':
    case 'AAY':
      return {
        bg: colors.badgeAAY,
        text: '#FFFFFF',
        label: 'Antyodaya (AAY)'
      };
    case 'BPL':
    case 'PHH':
      return {
        bg: colors.badgeBPL,
        text: '#FFFFFF',
        label: 'BPL (PHH)'
      };
    case 'APL':
    case 'NPHH':
    default:
      return {
        bg: colors.badgeAPL,
        text: '#FFFFFF',
        label: 'APL (NPHH)'
      };
  }
};
