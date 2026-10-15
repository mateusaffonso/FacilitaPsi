/**
 * Login com Google (somente para acessar o Drive).
 *
 * Dois métodos, porque o login por popup pode falhar no iPhone com o app instalado:
 * - "popup": Google Identity Services (padrão no computador e no Android);
 * - "redirecionamento": a página vai até o Google e volta com o token (padrão no iPhone instalado).
 */

export const ESCOPO_DRIVE = 'https://www.googleapis.com/auth/drive.file'
const CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

const CHAVE_TOKEN = 'fp.tokenGoogle'
const CHAVE_ESTADO = 'fp.estadoLogin'
const CHAVE_METODO = 'fp.metodoLogin'

export type MetodoLogin = 'popup' | 'redirecionamento'

interface TokenSalvo {
  accessToken: string
  expiraEm: number
}

export function googleConfigurado(): boolean {
  return CLIENT_ID.length > 0
}

export function appInstalado(): boolean {
  const iosInstalado = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosInstalado || window.matchMedia('(display-mode: standalone)').matches
}

function ehIOS(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
}

export function metodoLogin(): MetodoLogin {
  const escolhido = localStorage.getItem(CHAVE_METODO)
  if (escolhido === 'popup' || escolhido === 'redirecionamento') return escolhido
  return ehIOS() && appInstalado() ? 'redirecionamento' : 'popup'
}

export function escolherMetodoLogin(metodo: MetodoLogin): void {
  localStorage.setItem(CHAVE_METODO, metodo)
}

function salvarToken(accessToken: string, expiraEmSegundos: number): void {
  // Margem de 1 minuto para não usar um token prestes a vencer.
  const token: TokenSalvo = { accessToken, expiraEm: Date.now() + (expiraEmSegundos - 60) * 1000 }
  localStorage.setItem(CHAVE_TOKEN, JSON.stringify(token))
}

/** Token de acesso ainda válido, ou `null` se for preciso conectar de novo. */
export function tokenValido(): string | null {
  const bruto = localStorage.getItem(CHAVE_TOKEN)
  if (!bruto) return null
  const token = JSON.parse(bruto) as TokenSalvo
  return token.expiraEm > Date.now() ? token.accessToken : null
}

export function esquecerToken(): void {
  localStorage.removeItem(CHAVE_TOKEN)
}

/**
 * Deve ser chamado ao abrir o app: se a página acabou de voltar do Google
 * (método "redirecionamento"), guarda o token e limpa o endereço.
 */
export function concluirLoginPorRedirecionamento(): { erro?: string } {
  const hash = window.location.hash
  if (!hash.includes('access_token=') && !hash.includes('error=')) return {}

  const params = new URLSearchParams(hash.slice(1))
  const estadoEsperado = localStorage.getItem(CHAVE_ESTADO)
  localStorage.removeItem(CHAVE_ESTADO)
  history.replaceState(null, '', window.location.pathname + window.location.search)

  if (params.get('error')) return { erro: `O Google recusou o acesso (${params.get('error')}).` }
  if (!estadoEsperado || params.get('state') !== estadoEsperado) {
    return { erro: 'Resposta do Google inválida. Tente conectar de novo.' }
  }
  salvarToken(params.get('access_token')!, Number(params.get('expires_in') ?? 3600))
  return {}
}

function iniciarRedirecionamento(): void {
  const estado = crypto.randomUUID()
  localStorage.setItem(CHAVE_ESTADO, estado)
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: window.location.origin + window.location.pathname,
    response_type: 'token',
    scope: ESCOPO_DRIVE,
    include_granted_scopes: 'true',
    state: estado,
  })
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}

// Tipos mínimos do Google Identity Services.
interface RespostaToken {
  access_token?: string
  expires_in?: number | string
  error?: string
}
interface ClienteToken {
  requestAccessToken(opcoes?: { prompt?: string }): void
}
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string
            scope: string
            callback: (resposta: RespostaToken) => void
            error_callback?: (erro: { type: string; message?: string }) => void
          }): ClienteToken
        }
      }
    }
  }
}

let scriptGoogle: Promise<void> | null = null

function carregarScriptGoogle(): Promise<void> {
  scriptGoogle ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptGoogle = null
      reject(new Error('Não foi possível carregar o login do Google. Verifique a internet.'))
    }
    document.head.appendChild(script)
  })
  return scriptGoogle
}

async function loginPorPopup(): Promise<void> {
  await carregarScriptGoogle()
  await new Promise<void>((resolve, reject) => {
    const cliente = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: ESCOPO_DRIVE,
      callback: (resposta) => {
        if (resposta.error || !resposta.access_token) {
          reject(new Error(`O Google recusou o acesso (${resposta.error ?? 'sem token'}).`))
          return
        }
        salvarToken(resposta.access_token, Number(resposta.expires_in ?? 3600))
        resolve()
      },
      error_callback: (erro) =>
        reject(new Error(`Login interrompido (${erro.type}). Tente o método "redirecionamento".`)),
    })
    cliente.requestAccessToken({ prompt: '' })
  })
}

/**
 * Conecta ao Google. No método "redirecionamento" a página sai do app
 * e esta promessa nunca termina: o login é concluído ao voltar.
 */
export async function conectarGoogle(): Promise<void> {
  if (!googleConfigurado()) {
    throw new Error('Google ainda não configurado: defina VITE_GOOGLE_CLIENT_ID (ver docs/guia-google-cloud.md).')
  }
  if (metodoLogin() === 'redirecionamento') {
    iniciarRedirecionamento()
    return new Promise(() => {})
  }
  await loginPorPopup()
}
