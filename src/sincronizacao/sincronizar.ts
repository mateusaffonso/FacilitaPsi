/**
 * Sincronização pelo Google Drive (ver docs/arquitetura.md, seção 4).
 *
 * Pasta "Facilita Psi" no Drive:
 * - chaves.json           cofre de chaves (só partes criptografadas)
 * - estado-<aparelho>.json  fotografia completa e criptografada do que cada aparelho conhece
 *
 * Cada aparelho escreve apenas no próprio arquivo de estado, então dois aparelhos
 * nunca disputam o mesmo arquivo. Na leitura, "a última edição vence" (mesclar.ts).
 */

import { db, gravarUltimaSincronizacao, lerCofre, obterAparelho } from '../dados/db'
import { cifrarJSON, decifrarJSON, type CofreChaves, type Envelope } from '../seguranca/cripto'
import { baixarTexto, ErroPrecisaConectar, garantirPasta, listarArquivos, salvarTexto } from './drive'
import { tokenValido } from './google'
import { mesclar, type RegistroSinc } from './mesclar'

const ARQUIVO_CHAVES = 'chaves.json'
const PREFIXO_ESTADO = 'estado-'

interface EstadoAparelho {
  aparelho: string
  geradoEm: string
  registros: RegistroSinc[]
}

export interface ResultadoSincronizacao {
  recebidos: number
  enviados: number
  quando: string
}

export class ErroCofreDiferente extends Error {
  constructor() {
    super(
      'Este aparelho tem um cofre diferente do que está no Drive. ' +
        'Apague os dados deste aparelho e use "Já uso em outro aparelho".',
    )
    this.name = 'ErroCofreDiferente'
  }
}

function exigirToken(): string {
  const token = tokenValido()
  if (!token) throw new ErroPrecisaConectar()
  return token
}

/** Usado ao configurar um segundo aparelho: busca o cofre criado pelo primeiro. */
export async function baixarCofreDoDrive(): Promise<CofreChaves | null> {
  const token = exigirToken()
  const pasta = await garantirPasta(token)
  const arquivo = (await listarArquivos(token, pasta)).find((a) => a.name === ARQUIVO_CHAVES)
  return arquivo ? (JSON.parse(await baixarTexto(token, arquivo.id)) as CofreChaves) : null
}

let emAndamento: Promise<ResultadoSincronizacao> | null = null

/** Evita duas sincronizações ao mesmo tempo (ex.: botão + sincronização automática). */
export function sincronizar(chaveDados: CryptoKey): Promise<ResultadoSincronizacao> {
  emAndamento ??= executar(chaveDados).finally(() => {
    emAndamento = null
  })
  return emAndamento
}

async function executar(chaveDados: CryptoKey): Promise<ResultadoSincronizacao> {
  const token = exigirToken()
  const aparelho = await obterAparelho()
  const cofreLocal = await lerCofre()
  if (!cofreLocal) throw new Error('Cofre local não encontrado.')

  const pasta = await garantirPasta(token)
  const arquivos = await listarArquivos(token, pasta)

  // 1. Cofre de chaves: o primeiro aparelho envia; os demais conferem se é o mesmo.
  const arquivoChaves = arquivos.find((a) => a.name === ARQUIVO_CHAVES)
  if (!arquivoChaves) {
    await salvarTexto(token, pasta, ARQUIVO_CHAVES, JSON.stringify(cofreLocal))
  } else {
    const cofreRemoto = JSON.parse(await baixarTexto(token, arquivoChaves.id)) as CofreChaves
    if (cofreRemoto.criadoEm !== cofreLocal.criadoEm) throw new ErroCofreDiferente()
  }

  // 2. Recebe o que os outros aparelhos conhecem.
  const meuArquivo = `${PREFIXO_ESTADO}${aparelho.id}.json`
  let recebidos = 0
  for (const arquivo of arquivos) {
    if (!arquivo.name.startsWith(PREFIXO_ESTADO) || arquivo.name === meuArquivo) continue
    const envelope = JSON.parse(await baixarTexto(token, arquivo.id)) as Envelope
    const estado = await decifrarJSON<EstadoAparelho>(chaveDados, envelope)
    const vencedores = mesclar(await db.registros.toArray(), estado.registros)
    await db.registros.bulkPut(vencedores.map((r) => ({ ...r, pendenteEnvio: 0 as const })))
    recebidos += vencedores.length
  }

  // 3. Envia a fotografia completa deste aparelho.
  const todos = await db.registros.toArray()
  const estado: EstadoAparelho = {
    aparelho: aparelho.id,
    geradoEm: new Date().toISOString(),
    registros: todos.map(({ id, atualizadoEm, aparelho, excluido, conteudo }) => ({
      id,
      atualizadoEm,
      aparelho,
      excluido,
      conteudo,
    })),
  }
  const existente = arquivos.find((a) => a.name === meuArquivo)
  await salvarTexto(
    token,
    pasta,
    meuArquivo,
    JSON.stringify(await cifrarJSON(chaveDados, estado)),
    existente?.id,
  )

  // 4. Marca como enviados só os registros que não mudaram durante o envio.
  const pendentes = todos.filter((r) => r.pendenteEnvio === 1)
  await db.transaction('rw', db.registros, async () => {
    for (const r of pendentes) {
      const atual = await db.registros.get(r.id)
      if (atual?.atualizadoEm === r.atualizadoEm) await db.registros.update(r.id, { pendenteEnvio: 0 })
    }
  })

  const quando = new Date().toISOString()
  await gravarUltimaSincronizacao(quando)
  return { recebidos, enviados: pendentes.length, quando }
}
