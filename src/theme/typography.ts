export const typography = {
  display: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '800' as const,
  },

  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800' as const,
  },

  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const,
  },

  h3: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: '600' as const,
  },

  body: {
    fontSize: 16,
    lineHeight: 25,
    fontWeight: '400' as const,
  },

  bodySmall: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400' as const,
  },

  caption: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500' as const,
  },

  code: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400' as const,
    fontFamily: 'monospace',
  },
} as const;
