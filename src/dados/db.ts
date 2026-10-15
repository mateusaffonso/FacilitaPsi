import Dexie, { type Table } from 'dexie'
import type { CofreChaves, Envelope } from '../seguranca/cripto'

/**
 * Registro como fica guardado no aparelho.
 * Só os campos de controle ficam abertos; todo o conteúdo vai em `conteudo`, criptografado.
 */
export interface RegistroLocal {
  id: string
  atualizadoEm: string
  aparelho: string
  excluido: boolean
  conteudo: Envelope
  /** 1 = alterado aqui e ainda não enviado ao Drive. */
  pendenteEnvio: 0 | 1
}

/** Conteúdo (decifrado) das anotações de teste da prova de conceito. */
export interface AnotacaoTeste {
  titulo: string
  texto: string
}

export interface Aparelho {
  id: string
  nome: string
}

interface ItemConfig {
  chave: string
  valor: unknown
}

class BancoFacilita extends Dexie {
  registros!: Table<RegistroLocal, string>
  config!: Table<ItemConfig, string>

  constructor() {
    super('facilita-psi')
    this.version(1).stores({
      registros: 'id, atualizadoEm, pendenteEnvio',
      config: 'chave',
    })
  }
}

export const db = new BancoFacilita()

async function lerConfig<T>(chave: string): Promise<T | undefined> {
  return (await db.config.get(chave))?.valor as T | undefined
}

async function gravarConfig(chave: string, valor: unknown): Promise<void> {
  await db.config.put({ chave, valor })
}

export const lerCofre = () => lerConfig<CofreChaves>('cofre')
export const gravarCofre = (cofre: CofreChaves) => gravarConfig('cofre', cofre)
export const lerUltimaSincronizacao = () => lerConfig<string>('ultimaSincronizacao')
export const gravarUltimaSincronizacao = (quando: string) =>
  gravarConfig('ultimaSincronizacao', quando)

function nomeDoAparelho(): string {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Celular Android' : 'Tablet Android'
  if (/Windows/.test(ua)) return 'Computador Windows'
  if (/Mac/.test(ua)) return 'Mac'
  return 'Aparelho'
}

/** Identificador fixo deste aparelho, criado no primeiro uso. */
export async function obterAparelho(): Promise<Aparelho> {
  const existente = await lerConfig<Aparelho>('aparelho')
  if (existente) return existente
  const novo = { id: crypto.randomUUID(), nome: nomeDoAparelho() }
  await gravarConfig('aparelho', novo)
  return novo
}
