import { Button } from '@mantine/core'
import { useState } from 'react'
import { apagarDadosDoAparelho, contarPendentesDeEnvio } from '../dados/db'

/**
 * Usado quando o aparelho ficou com um cofre diferente do que está no Drive,
 * ou para "zerar" um aparelho de testes. Pede confirmação e avisa sobre o que ainda não foi enviado.
 */
export default function BotaoApagarDados() {
  const [apagando, setApagando] = useState(false)

  const apagar = async () => {
    const pendentes = await contarPendentesDeEnvio()
    const aviso =
      'Isto apaga o cofre e as anotações guardados SÓ neste aparelho.\n' +
      'O que já foi sincronizado continua no Google Drive e nos outros aparelhos.' +
      (pendentes > 0
        ? `\n\nATENÇÃO: ${pendentes} alteração(ões) ainda não foram enviadas e serão perdidas.`
        : '') +
      '\n\nDepois, configure de novo com "Já uso em outro aparelho". Continuar?'
    if (!window.confirm(aviso)) return
    setApagando(true)
    await apagarDadosDoAparelho()
    window.location.reload()
  }

  return (
    <Button variant="outline" color="red" size="xs" loading={apagando} onClick={apagar}>
      Apagar dados deste aparelho
    </Button>
  )
}
