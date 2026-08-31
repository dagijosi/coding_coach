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
    primary: '#050706',
    secondary: '#0B0E0C',
    tertiary: '#101412',
  },

  surface: {
    primary: '#111613',
    secondary: '#171E1A',
    elevated: '#1D2621',
  },

  border: {
    default: '#222C26',
    strong: '#2E3A33',
  },

  text: {
    primary: '#F2F7F4',
    secondary: '#A4B4AC',
    muted: '#68776F',
    inverse: '#050706',
  },

  accent: {
    primary: '#4EBA86',
    secondary: '#68CD9B',
    soft: '#142C20',
    pressed: '#41A073',
  },

  status: {
    success: '#52B788',
    warning: '#E0A458',
    error: '#E26D64',
    info: '#6BA4D6',
  },

  difficulty: {
    easy: '#52B788',
    medium: '#E0A458',
    hard: '#E26D64',
  },

  white: '#FFFFFF',
  black: '#000000',
};
