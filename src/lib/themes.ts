/**
 * Sistema de Temas Multi-Tenancy
 * Define temas de cores com suporte a light/dark mode
 */

export type ThemeName = 'default' | 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'teal' | 'indigo';

export interface ThemeColors {
  // Cores principais
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  
  // Cores de fundo
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  
  // Cores secundárias
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  
  // Cores de borda e input
  border: string;
  input: string;
  ring: string;
  
  // Sidebar
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  
  // Cores de gráficos
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  description: string;
  light: ThemeColors;
  dark: ThemeColors;
  preview: {
    primary: string; // Cor para preview
    accent: string;
  };
}

/**
 * Tema Padrão (Preto/Dourado) - Mantém o padrão visual atual
 */
const defaultTheme: Theme = {
  name: 'default',
  displayName: 'Clássico',
  description: 'Tema preto e dourado elegante',
  preview: {
    primary: '#1a1a1a',
    accent: '#d4af37',
  },
  light: {
    primary: '0 0% 10%',
    primaryForeground: '0 0% 98%',
    accent: '43 74% 52%',
    accentForeground: '0 0% 10%',
    background: '0 0% 98%',
    foreground: '0 0% 10%',
    card: '0 0% 100%',
    cardForeground: '0 0% 10%',
    popover: '0 0% 100%',
    popoverForeground: '0 0% 10%',
    secondary: '0 0% 23%',
    secondaryForeground: '0 0% 98%',
    muted: '0 0% 96%',
    mutedForeground: '0 0% 45%',
    border: '0 0% 90%',
    input: '0 0% 90%',
    ring: '43 74% 52%',
    sidebarBackground: '0 0% 98%',
    sidebarForeground: '240 5.3% 26.1%',
    sidebarPrimary: '240 5.9% 10%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '240 4.8% 95.9%',
    sidebarAccentForeground: '240 5.9% 10%',
    sidebarBorder: '220 13% 91%',
    sidebarRing: '43 74% 52%',
    chart1: '221 83% 53%',
    chart2: '142 76% 36%',
    chart3: '43 74% 52%',
    chart4: '280 65% 60%',
    chart5: '12 76% 61%',
  },
  dark: {
    primary: '0 0% 98%',
    primaryForeground: '0 0% 10%',
    accent: '43 74% 52%',
    accentForeground: '0 0% 10%',
    background: '0 0% 10%',
    foreground: '0 0% 98%',
    card: '0 0% 15%',
    cardForeground: '0 0% 98%',
    popover: '0 0% 15%',
    popoverForeground: '0 0% 98%',
    secondary: '0 0% 23%',
    secondaryForeground: '0 0% 98%',
    muted: '0 0% 20%',
    mutedForeground: '0 0% 65%',
    border: '0 0% 23%',
    input: '0 0% 23%',
    ring: '43 74% 52%',
    sidebarBackground: '240 5.9% 10%',
    sidebarForeground: '240 4.8% 95.9%',
    sidebarPrimary: '224.3 76.3% 48%',
    sidebarPrimaryForeground: '0 0% 100%',
    sidebarAccent: '240 3.7% 15.9%',
    sidebarAccentForeground: '240 4.8% 95.9%',
    sidebarBorder: '240 3.7% 15.9%',
    sidebarRing: '43 74% 52%',
    chart1: '221 83% 60%',
    chart2: '142 70% 45%',
    chart3: '43 74% 55%',
    chart4: '280 65% 65%',
    chart5: '12 76% 65%',
  },
};

/**
 * Tema Azul
 */
const blueTheme: Theme = {
  name: 'blue',
  displayName: 'Azul Profissional',
  description: 'Tema azul moderno e confiável',
  preview: {
    primary: '#1e40af',
    accent: '#3b82f6',
  },
  light: {
    primary: '217 91% 60%',
    primaryForeground: '0 0% 98%',
    accent: '217 91% 60%',
    accentForeground: '0 0% 98%',
    background: '0 0% 98%',
    foreground: '0 0% 10%',
    card: '0 0% 100%',
    cardForeground: '0 0% 10%',
    popover: '0 0% 100%',
    popoverForeground: '0 0% 10%',
    secondary: '217 33% 17%',
    secondaryForeground: '0 0% 98%',
    muted: '217 10% 96%',
    mutedForeground: '217 10% 45%',
    border: '217 20% 90%',
    input: '217 20% 90%',
    ring: '217 91% 60%',
    sidebarBackground: '0 0% 98%',
    sidebarForeground: '217 33% 17%',
    sidebarPrimary: '217 91% 60%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '217 10% 96%',
    sidebarAccentForeground: '217 33% 17%',
    sidebarBorder: '217 20% 90%',
    sidebarRing: '217 91% 60%',
    chart1: '217 91% 60%',
    chart2: '142 76% 36%',
    chart3: '43 74% 52%',
    chart4: '280 65% 60%',
    chart5: '12 76% 61%',
  },
  dark: {
    primary: '217 91% 60%',
    primaryForeground: '0 0% 98%',
    accent: '217 91% 60%',
    accentForeground: '0 0% 98%',
    background: '217 33% 10%',
    foreground: '0 0% 98%',
    card: '217 33% 15%',
    cardForeground: '0 0% 98%',
    popover: '217 33% 15%',
    popoverForeground: '0 0% 98%',
    secondary: '217 20% 23%',
    secondaryForeground: '0 0% 98%',
    muted: '217 20% 20%',
    mutedForeground: '217 10% 65%',
    border: '217 20% 23%',
    input: '217 20% 23%',
    ring: '217 91% 60%',
    sidebarBackground: '217 33% 10%',
    sidebarForeground: '217 10% 95%',
    sidebarPrimary: '217 91% 60%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '217 20% 20%',
    sidebarAccentForeground: '217 10% 95%',
    sidebarBorder: '217 20% 20%',
    sidebarRing: '217 91% 60%',
    chart1: '217 91% 70%',
    chart2: '142 70% 45%',
    chart3: '43 74% 55%',
    chart4: '280 65% 65%',
    chart5: '12 76% 65%',
  },
};

/**
 * Tema Verde
 */
const greenTheme: Theme = {
  name: 'green',
  displayName: 'Verde Natural',
  description: 'Tema verde fresco e sustentável',
  preview: {
    primary: '#059669',
    accent: '#10b981',
  },
  light: {
    primary: '142 76% 36%',
    primaryForeground: '0 0% 98%',
    accent: '142 70% 49%',
    accentForeground: '0 0% 98%',
    background: '0 0% 98%',
    foreground: '0 0% 10%',
    card: '0 0% 100%',
    cardForeground: '0 0% 10%',
    popover: '0 0% 100%',
    popoverForeground: '0 0% 10%',
    secondary: '142 30% 17%',
    secondaryForeground: '0 0% 98%',
    muted: '142 10% 96%',
    mutedForeground: '142 10% 45%',
    border: '142 20% 90%',
    input: '142 20% 90%',
    ring: '142 70% 49%',
    sidebarBackground: '0 0% 98%',
    sidebarForeground: '142 30% 17%',
    sidebarPrimary: '142 76% 36%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '142 10% 96%',
    sidebarAccentForeground: '142 30% 17%',
    sidebarBorder: '142 20% 90%',
    sidebarRing: '142 70% 49%',
    chart1: '142 76% 36%',
    chart2: '217 91% 60%',
    chart3: '43 74% 52%',
    chart4: '280 65% 60%',
    chart5: '12 76% 61%',
  },
  dark: {
    primary: '142 70% 49%',
    primaryForeground: '0 0% 10%',
    accent: '142 70% 49%',
    accentForeground: '0 0% 10%',
    background: '142 30% 10%',
    foreground: '0 0% 98%',
    card: '142 30% 15%',
    cardForeground: '0 0% 98%',
    popover: '142 30% 15%',
    popoverForeground: '0 0% 98%',
    secondary: '142 20% 23%',
    secondaryForeground: '0 0% 98%',
    muted: '142 20% 20%',
    mutedForeground: '142 10% 65%',
    border: '142 20% 23%',
    input: '142 20% 23%',
    ring: '142 70% 49%',
    sidebarBackground: '142 30% 10%',
    sidebarForeground: '142 10% 95%',
    sidebarPrimary: '142 70% 49%',
    sidebarPrimaryForeground: '0 0% 10%',
    sidebarAccent: '142 20% 20%',
    sidebarAccentForeground: '142 10% 95%',
    sidebarBorder: '142 20% 20%',
    sidebarRing: '142 70% 49%',
    chart1: '142 70% 55%',
    chart2: '217 91% 60%',
    chart3: '43 74% 55%',
    chart4: '280 65% 65%',
    chart5: '12 76% 65%',
  },
};

/**
 * Tema Roxo
 */
const purpleTheme: Theme = {
  name: 'purple',
  displayName: 'Roxo Criativo',
  description: 'Tema roxo inovador e criativo',
  preview: {
    primary: '#7c3aed',
    accent: '#a78bfa',
  },
  light: {
    primary: '280 65% 60%',
    primaryForeground: '0 0% 98%',
    accent: '280 65% 70%',
    accentForeground: '0 0% 98%',
    background: '0 0% 98%',
    foreground: '0 0% 10%',
    card: '0 0% 100%',
    cardForeground: '0 0% 10%',
    popover: '0 0% 100%',
    popoverForeground: '0 0% 10%',
    secondary: '280 30% 17%',
    secondaryForeground: '0 0% 98%',
    muted: '280 10% 96%',
    mutedForeground: '280 10% 45%',
    border: '280 20% 90%',
    input: '280 20% 90%',
    ring: '280 65% 60%',
    sidebarBackground: '0 0% 98%',
    sidebarForeground: '280 30% 17%',
    sidebarPrimary: '280 65% 60%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '280 10% 96%',
    sidebarAccentForeground: '280 30% 17%',
    sidebarBorder: '280 20% 90%',
    sidebarRing: '280 65% 60%',
    chart1: '280 65% 60%',
    chart2: '217 91% 60%',
    chart3: '142 76% 36%',
    chart4: '43 74% 52%',
    chart5: '12 76% 61%',
  },
  dark: {
    primary: '280 65% 70%',
    primaryForeground: '0 0% 98%',
    accent: '280 65% 70%',
    accentForeground: '0 0% 98%',
    background: '280 30% 10%',
    foreground: '0 0% 98%',
    card: '280 30% 15%',
    cardForeground: '0 0% 98%',
    popover: '280 30% 15%',
    popoverForeground: '0 0% 98%',
    secondary: '280 20% 23%',
    secondaryForeground: '0 0% 98%',
    muted: '280 20% 20%',
    mutedForeground: '280 10% 65%',
    border: '280 20% 23%',
    input: '280 20% 23%',
    ring: '280 65% 70%',
    sidebarBackground: '280 30% 10%',
    sidebarForeground: '280 10% 95%',
    sidebarPrimary: '280 65% 70%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '280 20% 20%',
    sidebarAccentForeground: '280 10% 95%',
    sidebarBorder: '280 20% 20%',
    sidebarRing: '280 65% 70%',
    chart1: '280 65% 75%',
    chart2: '217 91% 60%',
    chart3: '142 70% 45%',
    chart4: '43 74% 55%',
    chart5: '12 76% 65%',
  },
};

/**
 * Tema Vermelho
 */
const redTheme: Theme = {
  name: 'red',
  displayName: 'Vermelho Energético',
  description: 'Tema vermelho vibrante e dinâmico',
  preview: {
    primary: '#dc2626',
    accent: '#ef4444',
  },
  light: {
    primary: '0 72% 51%',
    primaryForeground: '0 0% 98%',
    accent: '0 84% 60%',
    accentForeground: '0 0% 98%',
    background: '0 0% 98%',
    foreground: '0 0% 10%',
    card: '0 0% 100%',
    cardForeground: '0 0% 10%',
    popover: '0 0% 100%',
    popoverForeground: '0 0% 10%',
    secondary: '0 30% 17%',
    secondaryForeground: '0 0% 98%',
    muted: '0 10% 96%',
    mutedForeground: '0 10% 45%',
    border: '0 20% 90%',
    input: '0 20% 90%',
    ring: '0 84% 60%',
    sidebarBackground: '0 0% 98%',
    sidebarForeground: '0 30% 17%',
    sidebarPrimary: '0 72% 51%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '0 10% 96%',
    sidebarAccentForeground: '0 30% 17%',
    sidebarBorder: '0 20% 90%',
    sidebarRing: '0 84% 60%',
    chart1: '0 84% 60%',
    chart2: '217 91% 60%',
    chart3: '142 76% 36%',
    chart4: '280 65% 60%',
    chart5: '43 74% 52%',
  },
  dark: {
    primary: '0 84% 60%',
    primaryForeground: '0 0% 98%',
    accent: '0 84% 60%',
    accentForeground: '0 0% 98%',
    background: '0 30% 10%',
    foreground: '0 0% 98%',
    card: '0 30% 15%',
    cardForeground: '0 0% 98%',
    popover: '0 30% 15%',
    popoverForeground: '0 0% 98%',
    secondary: '0 20% 23%',
    secondaryForeground: '0 0% 98%',
    muted: '0 20% 20%',
    mutedForeground: '0 10% 65%',
    border: '0 20% 23%',
    input: '0 20% 23%',
    ring: '0 84% 60%',
    sidebarBackground: '0 30% 10%',
    sidebarForeground: '0 10% 95%',
    sidebarPrimary: '0 84% 60%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '0 20% 20%',
    sidebarAccentForeground: '0 10% 95%',
    sidebarBorder: '0 20% 20%',
    sidebarRing: '0 84% 60%',
    chart1: '0 84% 70%',
    chart2: '217 91% 60%',
    chart3: '142 70% 45%',
    chart4: '280 65% 65%',
    chart5: '43 74% 55%',
  },
};

/**
 * Tema Laranja
 */
const orangeTheme: Theme = {
  name: 'orange',
  displayName: 'Laranja Vibrante',
  description: 'Tema laranja caloroso e acolhedor',
  preview: {
    primary: '#ea580c',
    accent: '#f97316',
  },
  light: {
    primary: '24 95% 53%',
    primaryForeground: '0 0% 98%',
    accent: '24 95% 58%',
    accentForeground: '0 0% 98%',
    background: '0 0% 98%',
    foreground: '0 0% 10%',
    card: '0 0% 100%',
    cardForeground: '0 0% 10%',
    popover: '0 0% 100%',
    popoverForeground: '0 0% 10%',
    secondary: '24 30% 17%',
    secondaryForeground: '0 0% 98%',
    muted: '24 10% 96%',
    mutedForeground: '24 10% 45%',
    border: '24 20% 90%',
    input: '24 20% 90%',
    ring: '24 95% 53%',
    sidebarBackground: '0 0% 98%',
    sidebarForeground: '24 30% 17%',
    sidebarPrimary: '24 95% 53%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '24 10% 96%',
    sidebarAccentForeground: '24 30% 17%',
    sidebarBorder: '24 20% 90%',
    sidebarRing: '24 95% 53%',
    chart1: '24 95% 53%',
    chart2: '217 91% 60%',
    chart3: '142 76% 36%',
    chart4: '280 65% 60%',
    chart5: '43 74% 52%',
  },
  dark: {
    primary: '24 95% 58%',
    primaryForeground: '0 0% 98%',
    accent: '24 95% 58%',
    accentForeground: '0 0% 98%',
    background: '24 30% 10%',
    foreground: '0 0% 98%',
    card: '24 30% 15%',
    cardForeground: '0 0% 98%',
    popover: '24 30% 15%',
    popoverForeground: '0 0% 98%',
    secondary: '24 20% 23%',
    secondaryForeground: '0 0% 98%',
    muted: '24 20% 20%',
    mutedForeground: '24 10% 65%',
    border: '24 20% 23%',
    input: '24 20% 23%',
    ring: '24 95% 58%',
    sidebarBackground: '24 30% 10%',
    sidebarForeground: '24 10% 95%',
    sidebarPrimary: '24 95% 58%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '24 20% 20%',
    sidebarAccentForeground: '24 10% 95%',
    sidebarBorder: '24 20% 20%',
    sidebarRing: '24 95% 58%',
    chart1: '24 95% 65%',
    chart2: '217 91% 60%',
    chart3: '142 70% 45%',
    chart4: '280 65% 65%',
    chart5: '43 74% 55%',
  },
};

/**
 * Tema Teal
 */
const tealTheme: Theme = {
  name: 'teal',
  displayName: 'Teal Moderno',
  description: 'Tema teal elegante e moderno',
  preview: {
    primary: '#0d9488',
    accent: '#14b8a6',
  },
  light: {
    primary: '173 80% 40%',
    primaryForeground: '0 0% 98%',
    accent: '173 80% 45%',
    accentForeground: '0 0% 98%',
    background: '0 0% 98%',
    foreground: '0 0% 10%',
    card: '0 0% 100%',
    cardForeground: '0 0% 10%',
    popover: '0 0% 100%',
    popoverForeground: '0 0% 10%',
    secondary: '173 30% 17%',
    secondaryForeground: '0 0% 98%',
    muted: '173 10% 96%',
    mutedForeground: '173 10% 45%',
    border: '173 20% 90%',
    input: '173 20% 90%',
    ring: '173 80% 40%',
    sidebarBackground: '0 0% 98%',
    sidebarForeground: '173 30% 17%',
    sidebarPrimary: '173 80% 40%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '173 10% 96%',
    sidebarAccentForeground: '173 30% 17%',
    sidebarBorder: '173 20% 90%',
    sidebarRing: '173 80% 40%',
    chart1: '173 80% 40%',
    chart2: '217 91% 60%',
    chart3: '142 76% 36%',
    chart4: '280 65% 60%',
    chart5: '43 74% 52%',
  },
  dark: {
    primary: '173 80% 45%',
    primaryForeground: '0 0% 98%',
    accent: '173 80% 45%',
    accentForeground: '0 0% 98%',
    background: '173 30% 10%',
    foreground: '0 0% 98%',
    card: '173 30% 15%',
    cardForeground: '0 0% 98%',
    popover: '173 30% 15%',
    popoverForeground: '0 0% 98%',
    secondary: '173 20% 23%',
    secondaryForeground: '0 0% 98%',
    muted: '173 20% 20%',
    mutedForeground: '173 10% 65%',
    border: '173 20% 23%',
    input: '173 20% 23%',
    ring: '173 80% 45%',
    sidebarBackground: '173 30% 10%',
    sidebarForeground: '173 10% 95%',
    sidebarPrimary: '173 80% 45%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '173 20% 20%',
    sidebarAccentForeground: '173 10% 95%',
    sidebarBorder: '173 20% 20%',
    sidebarRing: '173 80% 45%',
    chart1: '173 80% 50%',
    chart2: '217 91% 60%',
    chart3: '142 70% 45%',
    chart4: '280 65% 65%',
    chart5: '43 74% 55%',
  },
};

/**
 * Tema Indigo
 */
const indigoTheme: Theme = {
  name: 'indigo',
  displayName: 'Indigo Profissional',
  description: 'Tema indigo sofisticado e profissional',
  preview: {
    primary: '#4f46e5',
    accent: '#6366f1',
  },
  light: {
    primary: '239 84% 67%',
    primaryForeground: '0 0% 98%',
    accent: '239 84% 72%',
    accentForeground: '0 0% 98%',
    background: '0 0% 98%',
    foreground: '0 0% 10%',
    card: '0 0% 100%',
    cardForeground: '0 0% 10%',
    popover: '0 0% 100%',
    popoverForeground: '0 0% 10%',
    secondary: '239 30% 17%',
    secondaryForeground: '0 0% 98%',
    muted: '239 10% 96%',
    mutedForeground: '239 10% 45%',
    border: '239 20% 90%',
    input: '239 20% 90%',
    ring: '239 84% 67%',
    sidebarBackground: '0 0% 98%',
    sidebarForeground: '239 30% 17%',
    sidebarPrimary: '239 84% 67%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '239 10% 96%',
    sidebarAccentForeground: '239 30% 17%',
    sidebarBorder: '239 20% 90%',
    sidebarRing: '239 84% 67%',
    chart1: '239 84% 67%',
    chart2: '217 91% 60%',
    chart3: '142 76% 36%',
    chart4: '280 65% 60%',
    chart5: '43 74% 52%',
  },
  dark: {
    primary: '239 84% 72%',
    primaryForeground: '0 0% 98%',
    accent: '239 84% 72%',
    accentForeground: '0 0% 98%',
    background: '239 30% 10%',
    foreground: '0 0% 98%',
    card: '239 30% 15%',
    cardForeground: '0 0% 98%',
    popover: '239 30% 15%',
    popoverForeground: '0 0% 98%',
    secondary: '239 20% 23%',
    secondaryForeground: '0 0% 98%',
    muted: '239 20% 20%',
    mutedForeground: '239 10% 65%',
    border: '239 20% 23%',
    input: '239 20% 23%',
    ring: '239 84% 72%',
    sidebarBackground: '239 30% 10%',
    sidebarForeground: '239 10% 95%',
    sidebarPrimary: '239 84% 72%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '239 20% 20%',
    sidebarAccentForeground: '239 10% 95%',
    sidebarBorder: '239 20% 20%',
    sidebarRing: '239 84% 72%',
    chart1: '239 84% 75%',
    chart2: '217 91% 60%',
    chart3: '142 70% 45%',
    chart4: '280 65% 65%',
    chart5: '43 74% 55%',
  },
};

/**
 * Exporta todos os temas disponíveis
 */
export const themes: Record<ThemeName, Theme> = {
  default: defaultTheme,
  blue: blueTheme,
  green: greenTheme,
  purple: purpleTheme,
  red: redTheme,
  orange: orangeTheme,
  teal: tealTheme,
  indigo: indigoTheme,
};

/**
 * Obtém um tema por nome
 */
export function getTheme(name: ThemeName): Theme {
  return themes[name] || themes.default;
}

/**
 * Aplica um tema ao documento
 */
export function applyTheme(theme: Theme, isDark: boolean = false): void {
  const colors = isDark ? theme.dark : theme.light;
  const root = document.documentElement;
  
  // Aplicar todas as variáveis CSS
  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
  
  // Aplicar classe dark se necessário
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Remove tema aplicado (volta ao padrão)
 */
export function removeTheme(): void {
  const root = document.documentElement;
  // Remove todas as variáveis customizadas
  Object.keys(themes.default.light).forEach((key) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.removeProperty(cssVar);
  });
}
