import '@mantine/core/styles.css'
import './index.css'

import { MantineProvider } from '@mantine/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { tema } from './app/tema'
import { concluirLoginPorRedirecionamento } from './sincronizacao/google'

// Precisa rodar antes de tudo: se a página voltou do login do Google, guarda o token.
const { erro: erroLogin } = concluirLoginPorRedirecionamento()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={tema} defaultColorScheme="light">
      <App erroLogin={erroLogin} />
    </MantineProvider>
  </StrictMode>,
)
