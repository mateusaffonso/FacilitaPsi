/**
 * Criptografia do Facilita Psi (ver docs/arquitetura.md, seção 3.1).
 *
 * - A "chave dos dados" (AES-256-GCM) é sorteada uma única vez e criptografa tudo.
 * - Ela fica guardada "embrulhada" duas vezes: pela senha do app e pela chave de recuperação.
 * - Usa apenas a Web Crypto API, nativa do navegador.
 */

const ITERACOES_SENHA = 600_000
const ITERACOES_RECUPERACAO = 100_000
const ALFABETO_RECUPERACAO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ' // base32 de Crockford, sem I, L, O, U

type Bytes = Uint8Array<ArrayBuffer>

/** Conteúdo criptografado, pronto para ser salvo como JSON. */
export interface Envelope {
  v: 1
  iv: string
  ct: string
}

/** Arquivo de chaves (fica no aparelho e no Drive como `chaves.json`). Não contém nada legível. */
export interface CofreChaves {
  versao: 1
  criadoEm: string
  senha: { sal: string; iteracoes: number; chaveEmbrulhada: Envelope }
  recuperacao: { sal: string; iteracoes: number; chaveEmbrulhada: Envelope }
}

export class ErroSenhaIncorreta extends Error {
  constructor() {
    super('Senha ou chave de recuperação incorreta.')
    this.name = 'ErroSenhaIncorreta'
  }
}

export function paraBase64(bytes: Bytes): string {
  let binario = ''
  for (const b of bytes) binario += String.fromCharCode(b)
  return btoa(binario)
}

export function deBase64(texto: string): Bytes {
  const binario = atob(texto)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return bytes
}

function bytesAleatorios(tamanho: number): Bytes {
  return crypto.getRandomValues(new Uint8Array(tamanho))
}

async function derivarChave(segredo: string, sal: Bytes, iteracoes: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(segredo),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: sal, iterations: iteracoes, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function cifrarBytes(chave: CryptoKey, dados: Bytes): Promise<Envelope> {
  const iv = bytesAleatorios(12)
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, chave, dados))
  return { v: 1, iv: paraBase64(iv), ct: paraBase64(ct) }
}

async function decifrarBytes(chave: CryptoKey, envelope: Envelope): Promise<Bytes> {
  const claro = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: deBase64(envelope.iv) },
    chave,
    deBase64(envelope.ct),
  )
  return new Uint8Array(claro)
}

async function importarChaveDados(bruta: Bytes): Promise<CryptoKey> {
  // Exportável para permitir trocar a senha (reembrulhar) sem recriptografar os dados.
  return crypto.subtle.importKey('raw', bruta, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
}

/** Gera uma chave de recuperação legível: 8 grupos de 4 caracteres (160 bits). */
export function gerarChaveRecuperacao(): string {
  const bytes = bytesAleatorios(32)
  const caracteres = Array.from(bytes, (b) => ALFABETO_RECUPERACAO[b % 32])
  const grupos: string[] = []
  for (let i = 0; i < 32; i += 4) grupos.push(caracteres.slice(i, i + 4).join(''))
  return grupos.join('-')
}

/** Aceita a chave digitada com espaços, hífens ou letras minúsculas. */
export function normalizarChaveRecuperacao(digitada: string): string {
  return digitada.toUpperCase().replace(/[^0-9A-Z]/g, '')
}

async function embrulhar(chaveDados: CryptoKey, segredo: string, iteracoes: number) {
  const sal = bytesAleatorios(16)
  const kek = await derivarChave(segredo, sal, iteracoes)
  const bruta = new Uint8Array(await crypto.subtle.exportKey('raw', chaveDados))
  return { sal: paraBase64(sal), iteracoes, chaveEmbrulhada: await cifrarBytes(kek, bruta) }
}

async function desembrulhar(
  parte: CofreChaves['senha'],
  segredo: string,
): Promise<CryptoKey> {
  const kek = await derivarChave(segredo, deBase64(parte.sal), parte.iteracoes)
  try {
    return await importarChaveDados(await decifrarBytes(kek, parte.chaveEmbrulhada))
  } catch {
    throw new ErroSenhaIncorreta()
  }
}

/** Cria o cofre no primeiro uso. A chave de recuperação deve ser mostrada uma única vez. */
export async function criarCofre(senha: string) {
  const chaveDados = await importarChaveDados(bytesAleatorios(32))
  const chaveRecuperacao = gerarChaveRecuperacao()
  const cofre: CofreChaves = {
    versao: 1,
    criadoEm: new Date().toISOString(),
    senha: await embrulhar(chaveDados, senha, ITERACOES_SENHA),
    recuperacao: await embrulhar(
      chaveDados,
      normalizarChaveRecuperacao(chaveRecuperacao),
      ITERACOES_RECUPERACAO,
    ),
  }
  return { cofre, chaveDados, chaveRecuperacao }
}

export function abrirCofreComSenha(cofre: CofreChaves, senha: string): Promise<CryptoKey> {
  return desembrulhar(cofre.senha, senha)
}

export function abrirCofreComRecuperacao(cofre: CofreChaves, chave: string): Promise<CryptoKey> {
  return desembrulhar(cofre.recuperacao, normalizarChaveRecuperacao(chave))
}

/** Troca a senha mantendo a mesma chave dos dados (nada precisa ser recriptografado). */
export async function trocarSenha(
  cofre: CofreChaves,
  chaveDados: CryptoKey,
  novaSenha: string,
): Promise<CofreChaves> {
  return { ...cofre, senha: await embrulhar(chaveDados, novaSenha, ITERACOES_SENHA) }
}

export async function cifrarJSON(chave: CryptoKey, valor: unknown): Promise<Envelope> {
  return cifrarBytes(chave, new TextEncoder().encode(JSON.stringify(valor)))
}

export async function decifrarJSON<T>(chave: CryptoKey, envelope: Envelope): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await decifrarBytes(chave, envelope))) as T
}
