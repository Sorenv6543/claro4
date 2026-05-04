/**
 * Chart.js global registration and Materio theme defaults.
 *
 * Import this module (side-effect) before rendering any vue-chartjs component.
 * Exports a color palette and helper that match Claro design tokens.
 */
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
)

// ── Global Materio-themed defaults ──────────────────────────────────────
ChartJS.defaults.font.family = '\'Inter\', sans-serif'
ChartJS.defaults.color = 'rgba(46, 38, 61, 0.5)'
ChartJS.defaults.responsive = true
ChartJS.defaults.maintainAspectRatio = false
ChartJS.defaults.plugins.legend.labels.usePointStyle = true
ChartJS.defaults.plugins.legend.labels.padding = 16
ChartJS.defaults.plugins.tooltip.padding = 12
ChartJS.defaults.plugins.tooltip.cornerRadius = 8

/** Grid / axis line color — derived from Materio foreground at 6% opacity. */
export const CHART_GRID_COLOR = 'rgba(46, 38, 61, 0.06)'

// ── Color palette (matches tokens.css / vuetify.ts) ─────────────────────
export const CHART_COLORS = {
  primary: '#7367F0',
  primaryLight: '#9E95F5',
  success: '#28C76F',
  warning: '#FF9F43',
  error: '#EA5455',
  info: '#00CFE8',
  secondary: '#A8AAAE',
} as const

/** Ordered palette for multi-dataset charts. */
export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.info,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.error,
  CHART_COLORS.primaryLight,
  CHART_COLORS.secondary,
] as const

/** Appends hex alpha to a color string. `withAlpha('#7367F0', 0.2)` → `'#7367F033'` */
export function withAlpha (hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
}
