import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Group,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { decifrarAnotacoes, excluirAnotacao, salvarAnotacao, type Anotacao } from '../dados/anotacoes'
import { db, lerUltimaSincronizacao, obterAparelho, type Aparelho } from '../dados/db'
import { contaConectada } from '../sincronizacao/drive'
import {
  appInstalado,
  conectarGoogle,
  escolherMetodoLogin,
  googleConfigurado,
  metodoLogin,
  tokenValido,
  type MetodoLogin,
} from '../sincronizacao/google'
import { sincronizar } from '../sincronizacao/sincronizar'
import Cabecalho from './Cabecalho'

const INTERVALO_SINCRONIZACAO_MS = 2 * 60 * 1000

interface Props {
  chaveDados: CryptoKey
  erroLogin?: string
  onBloquear: () => void
}

function formatarDataHora(iso?: string): string {
  if (!iso) return 'nunca'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function Principal({ chaveDados, erroLogin, onBloquear }: Props) {
  const registros = useLiveQuery(() => db.registros.toArray(), [])
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([])
  const pendentes = registros?.filter((r) => r.pendenteEnvio === 1).length ?? 0

  useEffect(() => {
    if (registros) decifrarAnotacoes(chaveDados, registros).then(setAnotacoes)
  }, [registros, chaveDados])

  // --- Sincronização ---
  const [conectado, setConectado] = useState(() => tokenValido() !== null)
  const [conta, setConta] = useState<string>()
  const [ultima, setUltima] = useState<string>()
  const [sincronizando, setSincronizando] = useState(false)
  const [mensagem, setMensagem] = useState<{ cor: string; texto: string } | undefined>(
    erroLogin ? { cor: 'red', texto: erroLogin } : undefined,
  )

  const sincronizarAgora = useCallback(async () => {
    if (!tokenValido()) {
      setConectado(false)
      return
    }
    if (!navigator.onLine) {
      setMensagem({ cor: 'yellow', texto: 'Sem internet. As alterações serão enviadas depois.' })
      return
    }
    setSincronizando(true)
    try {
      const r = await sincronizar(chaveDados)
      setUltima(r.quando)
      setMensagem({ cor: 'green', texto: `Sincronizado: ${r.recebidos} recebido(s), ${r.enviados} enviado(s).` })
    } catch (e) {
      setConectado(tokenValido() !== null)
      setMensagem({ cor: 'red', texto: (e as Error).message })
    } finally {
      setSincronizando(false)
    }
  }, [chaveDados])

  useEffect(() => {
    lerUltimaSincronizacao().then(setUltima)
  }, [])

  useEffect(() => {
    if (!conectado) return
    contaConectada(tokenValido()!).then(setConta).catch(() => setConta(undefined))
    const primeira = setTimeout(sincronizarAgora, 0)
    const intervalo = setInterval(sincronizarAgora, INTERVALO_SINCRONIZACAO_MS)
    window.addEventListener('online', sincronizarAgora)
    return () => {
      clearTimeout(primeira)
      clearInterval(intervalo)
      window.removeEventListener('online', sincronizarAgora)
    }
  }, [conectado, sincronizarAgora])

  const conectar = async () => {
    try {
      await conectarGoogle()
      setConectado(true)
    } catch (e) {
      setMensagem({ cor: 'red', texto: (e as Error).message })
    }
  }

  // --- Nova anotação ---
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')

  const salvar = async () => {
    if (!titulo.trim()) return
    await salvarAnotacao(chaveDados, { titulo: titulo.trim(), texto: texto.trim() })
    setTitulo('')
    setTexto('')
    if (conectado) sincronizarAgora()
  }

  return (
    <>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Cabecalho subtitulo="Teste de instalação, criptografia e sincronização" />
        <Button variant="subtle" size="xs" style={{ flexShrink: 0 }} onClick={onBloquear}>
          Bloquear
        </Button>
      </Group>

      <Stack>
        <Card withBorder padding="lg">
          <Stack gap="sm">
            <Group justify="space-between">
              <Title order={4}>Sincronização com o Google Drive</Title>
              {pendentes > 0 ? (
                <Badge color="yellow">{pendentes} aguardando envio</Badge>
              ) : (
                <Badge color="green">tudo enviado</Badge>
              )}
            </Group>
            {!googleConfigurado() && (
              <Alert color="yellow">
                O Client ID do Google ainda não foi configurado (docs/guia-google-cloud.md). O app
                funciona só neste aparelho.
              </Alert>
            )}
            <Text size="sm">
              Conta: <b>{conectado ? (conta ?? 'conectada') : 'não conectada'}</b> · Última
              sincronização: <b>{formatarDataHora(ultima)}</b>
            </Text>
            {mensagem && <Alert color={mensagem.cor}>{mensagem.texto}</Alert>}
            {conectado ? (
              <Button loading={sincronizando} onClick={sincronizarAgora}>
                Sincronizar agora
              </Button>
            ) : (
              <Button onClick={conectar} disabled={!googleConfigurado()}>
                Conectar ao Google
              </Button>
            )}
          </Stack>
        </Card>

        <Card withBorder padding="lg">
          <Stack gap="sm">
            <Title order={4}>Nova anotação de teste</Title>
            <Text size="sm" c="dimmed">
              Teste também o ditado: toque no campo de texto e use o microfone do teclado.
            </Text>
            <TextInput label="Título" value={titulo} onChange={(e) => setTitulo(e.currentTarget.value)} />
            <Textarea
              label="Texto"
              autosize
              minRows={3}
              value={texto}
              onChange={(e) => setTexto(e.currentTarget.value)}
            />
            <Button onClick={salvar} disabled={!titulo.trim()}>
              Salvar
            </Button>
          </Stack>
        </Card>

        <Card withBorder padding="lg">
          <Title order={4} mb="sm">
            Anotações ({anotacoes.length})
          </Title>
          <Stack gap="xs">
            {anotacoes.length === 0 && (
              <Text size="sm" c="dimmed">
                Nenhuma anotação ainda.
              </Text>
            )}
            {anotacoes.map((a) => (
              <Card key={a.id} withBorder padding="sm" bg="azul.0">
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <div>
                    <Text fw={600}>{a.titulo}</Text>
                    {a.texto && (
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {a.texto}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed" mt={4}>
                      Escrita no {a.origem} · {formatarDataHora(a.atualizadoEm)}
                    </Text>
                  </div>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label="Excluir anotação"
                    onClick={async () => {
                      await excluirAnotacao(a.id)
                      if (conectado) sincronizarAgora()
                    }}
                  >
                    ✕
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </Stack>
        </Card>

        <Diagnostico amostraCifrada={registros?.find((r) => !r.excluido)?.conteudo.ct} />
      </Stack>
    </>
  )
}

function Diagnostico({ amostraCifrada }: { amostraCifrada?: string }) {
  const [aparelho, setAparelho] = useState<Aparelho>()
  const [persistente, setPersistente] = useState<boolean>()
  const [uso, setUso] = useState<string>()
  const [online, setOnline] = useState(navigator.onLine)
  const [metodo, setMetodo] = useState<MetodoLogin>(metodoLogin)

  useEffect(() => {
    obterAparelho().then(setAparelho)
    navigator.storage?.persisted?.().then(setPersistente)
    navigator.storage?.estimate?.().then((e) => setUso(`${((e.usage ?? 0) / 1024).toFixed(0)} KB`))
    const atualizar = () => setOnline(navigator.onLine)
    window.addEventListener('online', atualizar)
    window.addEventListener('offline', atualizar)
    return () => {
      window.removeEventListener('online', atualizar)
      window.removeEventListener('offline', atualizar)
    }
  }, [])

  const pedirPersistencia = async () => setPersistente(await navigator.storage.persist())

  const linhas: [string, ReactNode][] = [
    ['Aparelho', aparelho ? `${aparelho.nome} (${aparelho.id.slice(0, 8)})` : '…'],
    ['Aberto como app instalado', appInstalado() ? 'sim' : 'não (aberto no navegador)'],
    ['Internet', online ? 'conectado' : 'sem internet'],
    [
      'Armazenamento persistente',
      persistente ? (
        'sim'
      ) : (
        <Group gap="xs" key="persistencia">
          não
          <Button size="compact-xs" variant="light" onClick={pedirPersistencia}>
            Pedir
          </Button>
        </Group>
      ),
    ],
    ['Espaço usado', uso ?? '…'],
  ]

  return (
    <Card withBorder padding="lg">
      <Title order={4} mb="sm">
        Diagnóstico
      </Title>
      <Table>
        <Table.Tbody>
          {linhas.map(([rotulo, valor]) => (
            <Table.Tr key={rotulo}>
              <Table.Td c="dimmed">{rotulo}</Table.Td>
              <Table.Td>{valor}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Text size="sm" mt="md" mb={4}>
        Método de login no Google
      </Text>
      <SegmentedControl
        fullWidth
        value={metodo}
        onChange={(m) => {
          escolherMetodoLogin(m as MetodoLogin)
          setMetodo(m as MetodoLogin)
        }}
        data={[
          { value: 'popup', label: 'Popup' },
          { value: 'redirecionamento', label: 'Redirecionamento' },
        ]}
      />
      {amostraCifrada && (
        <>
          <Text size="sm" mt="md" mb={4}>
            Como uma anotação fica guardada neste aparelho (criptografada):
          </Text>
          <Code block style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
            {amostraCifrada.slice(0, 160)}…
          </Code>
        </>
      )}
    </Card>
  )
}
