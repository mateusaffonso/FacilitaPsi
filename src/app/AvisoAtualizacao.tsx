import { Alert, Button, Group, Text } from '@mantine/core'
import { useRegisterSW } from 'virtual:pwa-register/react'

const UMA_HORA_MS = 60 * 60 * 1000

/**
 * Quando uma nova versão do app é publicada, ela fica "na espera" até ser ativada.
 * Este aviso deixa a usuária ativar na hora, sem precisar fechar todas as janelas do app.
 * A atualização nunca acontece sozinha, para não interromper um registro sendo digitado.
 */
export default function AvisoAtualizacao() {
  const {
    needRefresh: [temNovaVersao, setTemNovaVersao],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (!registro) return
      // O app instalado no celular pode ficar aberto por dias: procura versões novas
      // a cada hora e sempre que volta para a frente da tela.
      setInterval(() => registro.update(), UMA_HORA_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registro.update()
      })
    },
  })

  if (!temNovaVersao) return null

  return (
    <Alert color="azul" mb="md" title="Nova versão do app disponível">
      <Text size="sm" mb="sm">
        Salve o que estiver escrevendo e toque em Atualizar.
      </Text>
      <Group gap="xs">
        <Button size="xs" onClick={() => updateServiceWorker(true)}>
          Atualizar
        </Button>
        <Button size="xs" variant="subtle" onClick={() => setTemNovaVersao(false)}>
          Depois
        </Button>
      </Group>
    </Alert>
  )
}
