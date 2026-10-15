/**
 * Acesso mínimo ao Google Drive (API v3) via fetch.
 * Com o escopo `drive.file`, o app só enxerga os arquivos que ele mesmo criou.
 */

import { esquecerToken } from './google'

const API = 'https://www.googleapis.com/drive/v3'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3'
const NOME_PASTA = 'Facilita Psi'
const TIPO_PASTA = 'application/vnd.google-apps.folder'

export interface ArquivoDrive {
  id: string
  name: string
  modifiedTime: string
}

export class ErroPrecisaConectar extends Error {
  constructor() {
    super('A conexão com o Google expirou. Toque em "Conectar ao Google".')
    this.name = 'ErroPrecisaConectar'
  }
}

async function chamar(token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const resposta = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  })
  if (resposta.status === 401) {
    esquecerToken()
    throw new ErroPrecisaConectar()
  }
  if (!resposta.ok) {
    throw new Error(`Erro do Google Drive (${resposta.status}): ${await resposta.text()}`)
  }
  return resposta
}

function aspas(texto: string): string {
  return `'${texto.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

export async function contaConectada(token: string): Promise<string> {
  const r = await chamar(token, `${API}/about?fields=user(emailAddress)`)
  return ((await r.json()) as { user: { emailAddress: string } }).user.emailAddress
}

/** Encontra a pasta "Facilita Psi" criada pelo app, ou cria uma. */
export async function garantirPasta(token: string): Promise<string> {
  const q = `name = ${aspas(NOME_PASTA)} and mimeType = ${aspas(TIPO_PASTA)} and trashed = false`
  const busca = await chamar(token, `${API}/files?${new URLSearchParams({ q, fields: 'files(id)', spaces: 'drive' })}`)
  const encontradas = ((await busca.json()) as { files: { id: string }[] }).files
  if (encontradas.length > 0) return encontradas[0].id

  const criada = await chamar(token, `${API}/files?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: NOME_PASTA, mimeType: TIPO_PASTA }),
  })
  return ((await criada.json()) as { id: string }).id
}

export async function listarArquivos(token: string, pastaId: string): Promise<ArquivoDrive[]> {
  const q = `${aspas(pastaId)} in parents and trashed = false`
  const params = new URLSearchParams({ q, fields: 'files(id,name,modifiedTime)', pageSize: '1000' })
  const r = await chamar(token, `${API}/files?${params}`)
  return ((await r.json()) as { files: ArquivoDrive[] }).files
}

export async function baixarTexto(token: string, arquivoId: string): Promise<string> {
  const r = await chamar(token, `${API}/files/${arquivoId}?alt=media`)
  return r.text()
}

/** Cria o arquivo na pasta, ou substitui o conteúdo se `arquivoId` for informado. */
export async function salvarTexto(
  token: string,
  pastaId: string,
  nome: string,
  conteudo: string,
  arquivoId?: string,
): Promise<void> {
  if (arquivoId) {
    await chamar(token, `${UPLOAD}/files/${arquivoId}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: conteudo,
    })
    return
  }
  const fronteira = `facilita-psi-${crypto.randomUUID()}`
  const corpo =
    `--${fronteira}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify({ name: nome, parents: [pastaId], mimeType: 'application/json' }) +
    `\r\n--${fronteira}\r\nContent-Type: application/json\r\n\r\n` +
    conteudo +
    `\r\n--${fronteira}--`
  await chamar(token, `${UPLOAD}/files?uploadType=multipart`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${fronteira}` },
    body: corpo,
  })
}
