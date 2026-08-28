export type ThemeColors = {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  surface: {
    primary: string;
    secondary: string;
    elevated: string;
  };
  border: {
    default: string;
    strong: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  accent: {
    primary: string;
    secondary: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  difficulty: {
    easy: string;
    medium: string;
    hard: string;
  };
  white: string;
  black: string;
};

// Calm, technical, warm, human-designed identity.
// Muted green is the Coding Coach brand accent shared across both themes.
export const lightColors: ThemeColors = {
  background: {
    primary: '#F6F7F5',
    secondary: '#EDEFEC',
    tertiary: '#E5E8E4',
  },

  surface: {
    primary: '#FFFFFF',
    secondary: '#F0F2EF',
    elevated: '#F5F6F4',
  },

  border: {
    default: '#DDE2DE',
    strong: '#C4CBC6',
  },

  text: {
    primary: '#202522',
    secondary: '#69716C',
    muted: '#8B948F',
    inverse: '#FFFFFF',
  },

  accent: {
    primary: '#3F6B57',
    secondary: '#5E7E6E',
  },

  status: {
    success: '#4E765C',
    warning: '#A27B45',
    error: '#A85D5D',
    info: '#4A6E8C',
  },

  difficulty: {
    easy: '#4E765C',
    medium: '#A27B45',
    hard: '#A85D5D',
  },

  white: '#FFFFFF',
  black: '#000000',
};

export const darkColors: ThemeColors = {
  background: {
    primary: '#151817',
    secondary: '#1B1F1D',
    tertiary: '#202523',
  },

  surface: {
    primary: '#1D211F',
    secondary: '#252A27',
    elevated: '#2A2F2C',
  },

  border: {
    default: '#303733',
    strong: '#3B433E',
  },

  text: {
    primary: '#E7EBE8',
    secondary: '#9CA59F',
    muted: '#6C746F',
    inverse: '#0C120E',
  },

  accent: {
    primary: '#78A88D',
    secondary: '#7FA8A0',
  },

  status: {
    success: '#7FA98A',
    warning: '#C19A61',
    error: '#C47A7A',
    info: '#7C9DB8',
  },

  difficulty: {
    easy: '#7FA98A',
    medium: '#C19A61',
    hard: '#C47A7A',
  },

  white: '#FFFFFF',
  black: '#000000',
};
