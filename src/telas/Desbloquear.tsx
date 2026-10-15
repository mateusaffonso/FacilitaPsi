import { Alert, Anchor, Button, Card, PasswordInput, Stack, TextInput } from '@mantine/core'
import { useState, type FormEvent } from 'react'
import {
  abrirCofreComRecuperacao,
  abrirCofreComSenha,
  ErroSenhaIncorreta,
  type CofreChaves,
} from '../seguranca/cripto'
import Cabecalho from './Cabecalho'

interface Props {
  cofre: CofreChaves
  erroLogin?: string
  onPronto: (chaveDados: CryptoKey) => void
}

export default function Desbloquear({ cofre, erroLogin, onPronto }: Props) {
  const [usarRecuperacao, setUsarRecuperacao] = useState(false)
  const [segredo, setSegredo] = useState('')
  const [erro, setErro] = useState<string>()
  const [abrindo, setAbrindo] = useState(false)

  const abrir = async (e: FormEvent) => {
    e.preventDefault()
    setAbrindo(true)
    setErro(undefined)
    try {
      onPronto(
        usarRecuperacao
          ? await abrirCofreComRecuperacao(cofre, segredo)
          : await abrirCofreComSenha(cofre, segredo),
      )
    } catch (err) {
      setErro(err instanceof ErroSenhaIncorreta ? err.message : (err as Error).message)
      setAbrindo(false)
    }
  }

  return (
    <>
      <Cabecalho subtitulo="Digite a senha para abrir" />
      {erroLogin && (
        <Alert color="red" mb="md">
          {erroLogin}
        </Alert>
      )}
      <Card withBorder padding="lg" component="form" onSubmit={abrir}>
        <Stack>
          {usarRecuperacao ? (
            <TextInput
              label="Chave de recuperação"
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              value={segredo}
              onChange={(e) => setSegredo(e.currentTarget.value)}
              error={erro}
              autoFocus
            />
          ) : (
            <PasswordInput
              label="Senha do app"
              value={segredo}
              onChange={(e) => setSegredo(e.currentTarget.value)}
              error={erro}
              autoFocus
            />
          )}
          <Button type="submit" loading={abrindo}>
            Abrir
          </Button>
          <Anchor
            component="button"
            type="button"
            size="sm"
            onClick={() => {
              setUsarRecuperacao(!usarRecuperacao)
              setSegredo('')
              setErro(undefined)
            }}
          >
            {usarRecuperacao ? 'Usar a senha' : 'Esqueci a senha (usar chave de recuperação)'}
          </Anchor>
        </Stack>
      </Card>
    </>
  )
}
