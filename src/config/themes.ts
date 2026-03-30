export interface ThemeConfig {
  name: string;
  label: string;
  labelAr: string;
  primary: { light: string; dark: string };
  accent: { light: string; dark: string };
  rgb: { light: string; dark: string };
}

export const themes: Record<string, ThemeConfig> = {
  rose: {
    name: "rose",
    label: "Rose",
    labelAr: "وردي",
    primary: { light: "#E11D48", dark: "#FB7185" },
    accent: { light: "#BE123C", dark: "#FDA4AF" },
    rgb: { light: "225 29 72", dark: "251 113 133" },
  },
  blue: {
    name: "blue",
    label: "Blue",
    labelAr: "أزرق",
    primary: { light: "#0066FF", dark: "#3388FF" },
    accent: { light: "#0052CC", dark: "#5599FF" },
    rgb: { light: "0 102 255", dark: "51 136 255" },
  },
  violet: {
    name: "violet",
    label: "Violet",
    labelAr: "بنفسجي",
    primary: { light: "#7C3AED", dark: "#A78BFA" },
    accent: { light: "#6D28D9", dark: "#C4B5FD" },
    rgb: { light: "124 58 237", dark: "167 139 250" },
  },
  emerald: {
    name: "emerald",
    label: "Emerald",
    labelAr: "زمردي",
    primary: { light: "#059669", dark: "#34D399" },
    accent: { light: "#047857", dark: "#6EE7B7" },
    rgb: { light: "5 150 105", dark: "52 211 153" },
  },
  amber: {
    name: "amber",
    label: "Amber",
    labelAr: "ذهبي",
    primary: { light: "#D97706", dark: "#FBBF24" },
    accent: { light: "#B45309", dark: "#FCD34D" },
    rgb: { light: "217 119 6", dark: "251 191 36" },
  },
  indigo: {
    name: "indigo",
    label: "Indigo",
    labelAr: "نيلي",
    primary: { light: "#4F46E5", dark: "#818CF8" },
    accent: { light: "#4338CA", dark: "#A5B4FC" },
    rgb: { light: "79 70 229", dark: "129 140 248" },
  },
  black: {
    name: "black",
    label: "Black",
    labelAr: "أسود",
    primary: { light: "#171717", dark: "#e5e5e5" },
    accent: { light: "#0a0a0a", dark: "#f5f5f5" },
    rgb: { light: "23 23 23", dark: "229 229 229" },
  },
};

export const defaultTheme = "blue";
