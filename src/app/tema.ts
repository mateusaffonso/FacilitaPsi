import { createTheme, type MantineColorsTuple } from '@mantine/core'

// Paleta derivada da logo (docs/especificacao.md, seção 13).
// Índice 4 = azul da logo (#6B95C2); índice 7 = azul profundo (#3E6A99), usado em botões.
const azul: MantineColorsTuple = [
  '#eef3f9',
  '#dce6f2',
  '#b7cce5',
  '#90b1d8',
  '#6b95c2',
  '#5a87b8',
  '#4c79ab',
  '#3e6a99',
  '#335a84',
  '#284a6e',
]

// Índice 3 = rosé da logo (#F4A9B0).
const rose: MantineColorsTuple = [
  '#fdf2f3',
  '#fce8ea',
  '#f8cfd3',
  '#f4a9b0',
  '#ec8a94',
  '#e2707c',
  '#d45d6a',
  '#b84a57',
  '#9a3d48',
  '#7c313a',
]

export const tema = createTheme({
  primaryColor: 'azul',
  primaryShade: 7,
  colors: { azul, rose },
  defaultRadius: 'md',
  fontFamily:
    'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  headings: { fontFamily: 'inherit' },
  black: '#2f3b48',
})
