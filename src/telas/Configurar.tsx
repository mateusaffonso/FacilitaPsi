import {
  Alert,
  Button,
  Card,
  Checkbox,
  Code,
  CopyButton,
  PasswordInput,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { gravarCofre } from '../dados/db'
import {
  abrirCofreComSenha,
  criarCofre,
  ErroSenhaIncorreta,
  type CofreChaves,
} from '../seguranca/cripto'
import { conectarGoogle, tokenValido } from '../sincronizacao/google'
import { baixarCofreDoDrive } from '../sincronizacao/sincronizar'
import Cabecalho from './Cabecalho'

type Modo = 'novo' | 'existente'
const CHAVE_MODO = 'fp.modoConfiguracao'
const SENHA_MINIMA = 8

interface Props {
  erroLogin?: string
  onPronto: (chaveDados: CryptoKey) => void
}

export default function Configurar({ erroLogin, onPronto }: Props) {
  // Lembra a escolha, porque o login por redirecionamento recarrega a página.
  const [modo, setModo] = useState<Modo>(
    () => (localStorage.getItem(CHAVE_MODO) as Modo | null) ?? 'novo',
  )
  const escolherModo = (m: string) => {
    localStorage.setItem(CHAVE_MODO, m)
    setModo(m as Modo)
  }

  return (
    <>
      <Cabecalho subtitulo="Configuração deste aparelho" />
      <Stack>
        {erroLogin && <Alert color="red">{erroLogin}</Alert>}
        <SegmentedControl
          fullWidth
          value={modo}
          onChange={escolherModo}
          data={[
            { value: 'novo', label: 'Primeiro aparelho' },
            { value: 'existente', label: 'Já uso em outro aparelho' },
          ]}
        />
        {modo === 'novo' ? <NovoCofre onPronto={onPronto} /> : <CofreExistente onPronto={onPronto} />}
      </Stack>
    </>
  )
}

function NovoCofre({ onPronto }: Pick<Props, 'onPronto'>) {
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState<string>()
  const [criando, setCriando] = useState(false)
  const [criado, setCriado] = useState<{ chaveDados: CryptoKey; chaveRecuperacao: string }>()
  const [guardou, setGuardou] = useState(false)

  const criar = async () => {
    if (senha.length < SENHA_MINIMA) return setErro(`Use pelo menos ${SENHA_MINIMA} caracteres.`)
    if (senha !== confirmacao) return setErro('As senhas não conferem.')
    setErro(undefined)
    setCriando(true)
    const { cofre, chaveDados, chaveRecuperacao } = await criarCofre(senha)
    await gravarCofre(cofre)
    localStorage.removeItem(CHAVE_MODO)
    setCriado({ chaveDados, chaveRecuperacao })
  }

  if (criado) {
    return (
      <Card withBorder padding="lg">
        <Stack>
          <Title order={4}>Guarde sua chave de recuperação</Title>
          <Text size="sm">
            Se a senha for esquecida, esta chave é a <b>única</b> forma de recuperar os dados.
            Anote ou imprima e guarde em local seguro. Ela não será mostrada de novo.
          </Text>
          <Code block fz="lg" ta="center" style={{ letterSpacing: 1 }}>
            {criado.chaveRecuperacao}
          </Code>
          <CopyButton value={criado.chaveRecuperacao}>
            {({ copied, copy }) => (
              <Button variant="light" onClick={copy}>
                {copied ? 'Copiada' : 'Copiar chave'}
              </Button>
            )}
          </CopyButton>
          <Checkbox
            checked={guardou}
            onChange={(e) => setGuardou(e.currentTarget.checked)}
            label="Guardei a chave de recuperação em local seguro"
          />
          <Button disabled={!guardou} onClick={() => onPronto(criado.chaveDados)}>
            Continuar
          </Button>
        </Stack>
      </Card>
    )
  }

  return (
    <Card withBorder padding="lg">
      <Stack>
        <Text size="sm">
          Crie a senha do app. Ela protege e criptografa todos os dados, neste e nos outros
          aparelhos.
        </Text>
        <PasswordInput label="Senha do app" value={senha} onChange={(e) => setSenha(e.currentTarget.value)} />
        <PasswordInput
          label="Confirme a senha"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.currentTarget.value)}
          error={erro}
        />
        <Button loading={criando} onClick={criar}>
          Criar cofre
        </Button>
      </Stack>
    </Card>
  )
}

function CofreExistente({ onPronto }: Pick<Props, 'onPronto'>) {
  const [conectado, setConectado] = useState(() => tokenValido() !== null)
  const [cofre, setCofre] = useState<CofreChaves | null>()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string>()
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    if (!conectado) return
    baixarCofreDoDrive()
      .then(setCofre)
      .catch((e: Error) => setErro(e.message))
  }, [conectado])

  const conectar = async () => {
    setErro(undefined)
    try {
      await conectarGoogle()
      setConectado(true)
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  const abrir = async () => {
    if (!cofre) return
    setOcupado(true)
    try {
      const chaveDados = await abrirCofreComSenha(cofre, senha)
      await gravarCofre(cofre)
      localStorage.removeItem(CHAVE_MODO)
      onPronto(chaveDados)
    } catch (e) {
      setErro(e instanceof ErroSenhaIncorreta ? 'Senha incorreta.' : (e as Error).message)
      setOcupado(false)
    }
  }

  return (
    <Card withBorder padding="lg">
      <Stack>
        <Text size="sm">
          Conecte a mesma conta Google usada no primeiro aparelho e digite a senha do app.
        </Text>
        {!conectado && <Button onClick={conectar}>Conectar ao Google</Button>}
        {conectado && cofre === undefined && !erro && <Text size="sm">Procurando o cofre no Drive…</Text>}
        {conectado && cofre === null && (
          <Alert color="yellow">
            Nenhum cofre encontrado no Drive. Configure primeiro o aparelho principal e sincronize.
          </Alert>
        )}
        {cofre && (
          <>
            <PasswordInput label="Senha do app" value={senha} onChange={(e) => setSenha(e.currentTarget.value)} />
            <Button loading={ocupado} onClick={abrir}>
              Abrir
            </Button>
          </>
        )}
        {erro && <Alert color="red">{erro}</Alert>}
      </Stack>
    </Card>
  )
}
