export const colors = {
  felt: '#0B3D2E',
  feltDark: '#072A20',
  feltLight: '#13513E',
  surface: '#124A39',
  surfaceRaised: '#195A46',
  border: '#2A7560',
  // Outlines of interactive controls (WCAG 1.4.11 asks for 3:1 against the surface behind them).
  borderStrong: '#4F9C85',
  gold: '#EBC35E',
  goldDark: '#B98F2E',
  cream: '#F7F1E1',
  textPrimary: '#F7F1E1',
  textSecondary: '#B7CBC2',
  textOnAccent: '#1B1405',
  danger: '#FF9488',
  success: '#7BE0A6',
  cardRed: '#C8372D',
  cardBlack: '#1C1C1E',
  overlay: 'rgba(0, 0, 0, 0.5)',
  // Cribbage board: wood body, dark holes, light markings, and one bright peg colour per lane.
  boardWood: '#6B4226',
  boardRim: '#B5834F',
  boardHole: '#120A04',
  boardLine: '#F7EBCB',
  pegRed: '#FF8577',
  pegBlue: '#6EC1FF',
  pegGreen: '#6FE39A',
} as const;

export type ColorToken = keyof typeof colors;
