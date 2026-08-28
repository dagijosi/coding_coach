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
    soft: string;
    pressed: string;
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
    primary: '#F3F5F2',
    secondary: '#EDF0EC',
    tertiary: '#E7EAE6',
  },

  surface: {
    primary: '#FFFFFF',
    secondary: '#F3F5F2',
    elevated: '#EEF2EF',
  },

  border: {
    default: '#D5DDD8',
    strong: '#C1CCC5',
  },

  text: {
    primary: '#17211C',
    secondary: '#5D6962',
    muted: '#87918B',
    inverse: '#FFFFFF',
  },

  accent: {
    primary: '#245A46',
    secondary: '#4A7B63',
    soft: '#DCEBE3',
    pressed: '#1D4938',
  },

  status: {
    success: '#2F6B50',
    warning: '#C9954A',
    error: '#B4534A',
    info: '#4A6E8C',
  },

  difficulty: {
    easy: '#2F6B50',
    medium: '#C9954A',
    hard: '#B4534A',
  },

  white: '#FFFFFF',
  black: '#000000',
};

export const darkColors: ThemeColors = {
  background: {
    primary: '#0C120F',
    secondary: '#101713',
    tertiary: '#141D19',
  },

  surface: {
    primary: '#141C18',
    secondary: '#1A241F',
    elevated: '#1B2621',
  },

  border: {
    default: '#29342E',
    strong: '#34413A',
  },

  text: {
    primary: '#E9F0EC',
    secondary: '#9CA9A1',
    muted: '#6B7871',
    inverse: '#0D1511',
  },

  accent: {
    primary: '#72B394',
    secondary: '#8BC3A8',
    soft: '#263F33',
    pressed: '#85C5A2',
  },

  status: {
    success: '#7FA98A',
    warning: '#C9954A',
    error: '#CE7B74',
    info: '#7C9DB8',
  },

  difficulty: {
    easy: '#7FA98A',
    medium: '#C9954A',
    hard: '#CE7B74',
  },

  white: '#FFFFFF',
  black: '#000000',
};
