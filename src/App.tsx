import { Center, Container, Loader } from '@mantine/core'
import { useEffect, useState } from 'react'
import { lerCofre } from './dados/db'
import type { CofreChaves } from './seguranca/cripto'
import Configurar from './telas/Configurar'
import Desbloquear from './telas/Desbloquear'
import Principal from './telas/Principal'

type Estado =
  | { tela: 'carregando' }
  | { tela: 'configurar' }
  | { tela: 'bloqueado'; cofre: CofreChaves }
  | { tela: 'aberto'; chaveDados: CryptoKey }

export default function App({ erroLogin }: { erroLogin?: string }) {
  const [estado, setEstado] = useState<Estado>({ tela: 'carregando' })

  useEffect(() => {
    lerCofre().then((cofre) =>
      setEstado(cofre ? { tela: 'bloqueado', cofre } : { tela: 'configurar' }),
    )
  }, [])

  const abrir = (chaveDados: CryptoKey) => setEstado({ tela: 'aberto', chaveDados })
  const bloquear = async () => {
    const cofre = await lerCofre()
    if (cofre) setEstado({ tela: 'bloqueado', cofre })
  }

  return (
    <Container size="sm" py="md">
      {estado.tela === 'carregando' && (
        <Center mih="60vh">
          <Loader />
        </Center>
      )}
      {estado.tela === 'configurar' && <Configurar erroLogin={erroLogin} onPronto={abrir} />}
      {estado.tela === 'bloqueado' && (
        <Desbloquear cofre={estado.cofre} erroLogin={erroLogin} onPronto={abrir} />
      )}
      {estado.tela === 'aberto' && (
        <Principal chaveDados={estado.chaveDados} erroLogin={erroLogin} onBloquear={bloquear} />
      )}
    </Container>
  )
}
