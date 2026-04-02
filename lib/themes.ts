export type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'red'

export const colorSchemes: Record<ColorScheme, Record<string, string>> = {
  blue: {
    primary: 'oklch(0.55 0.18 250)',
    'primary-foreground': 'oklch(1 0 0)',
    secondary: 'oklch(0.65 0.15 260)',
    accent: 'oklch(0.55 0.18 250)',
    'accent-foreground': 'oklch(1 0 0)',
  },
  purple: {
    primary: 'oklch(0.58 0.18 280)',
    'primary-foreground': 'oklch(1 0 0)',
    secondary: 'oklch(0.68 0.15 290)',
    accent: 'oklch(0.58 0.18 280)',
    'accent-foreground': 'oklch(1 0 0)',
  },
  green: {
    primary: 'oklch(0.58 0.18 140)',
    'primary-foreground': 'oklch(1 0 0)',
    secondary: 'oklch(0.68 0.15 150)',
    accent: 'oklch(0.58 0.18 140)',
    'accent-foreground': 'oklch(1 0 0)',
  },
  orange: {
    primary: 'oklch(0.62 0.18 40)',
    'primary-foreground': 'oklch(1 0 0)',
    secondary: 'oklch(0.72 0.15 50)',
    accent: 'oklch(0.62 0.18 40)',
    'accent-foreground': 'oklch(1 0 0)',
  },
  red: {
    primary: 'oklch(0.55 0.18 15)',
    'primary-foreground': 'oklch(1 0 0)',
    secondary: 'oklch(0.65 0.15 25)',
    accent: 'oklch(0.55 0.18 15)',
    'accent-foreground': 'oklch(1 0 0)',
  },
}

export const colorSchemeLabels: Record<ColorScheme, string> = {
  blue: '蓝色',
  purple: '紫色',
  green: '绿色',
  orange: '橙色',
  red: '红色',
}
