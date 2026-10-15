import { cifrarJSON, decifrarJSON } from '../seguranca/cripto'
import { db, obterAparelho, type AnotacaoTeste, type RegistroLocal } from './db'

export interface Anotacao extends AnotacaoTeste {
  id: string
  atualizadoEm: string
  origem: string
}

/** Conteúdo cifrado de uma anotação: o texto e o aparelho onde foi escrita. */
interface ConteudoAnotacao extends AnotacaoTeste {
  origem: string
}

export async function salvarAnotacao(chave: CryptoKey, dados: AnotacaoTeste): Promise<void> {
  const aparelho = await obterAparelho()
  const conteudo: ConteudoAnotacao = { ...dados, origem: aparelho.nome }
  await db.registros.put({
    id: crypto.randomUUID(),
    atualizadoEm: new Date().toISOString(),
    aparelho: aparelho.id,
    excluido: false,
    conteudo: await cifrarJSON(chave, conteudo),
    pendenteEnvio: 1,
  })
}

/** Exclusão "lógica": o registro vira uma marca de exclusão para que os outros aparelhos saibam. */
export async function excluirAnotacao(id: string): Promise<void> {
  const aparelho = await obterAparelho()
  await db.registros.update(id, {
    excluido: true,
    atualizadoEm: new Date().toISOString(),
    aparelho: aparelho.id,
    pendenteEnvio: 1,
  })
}

export async function decifrarAnotacoes(
  chave: CryptoKey,
  registros: RegistroLocal[],
): Promise<Anotacao[]> {
  const ativos = registros.filter((r) => !r.excluido)
  const anotacoes = await Promise.all(
    ativos.map(async (r) => ({
      id: r.id,
      atualizadoEm: r.atualizadoEm,
      ...(await decifrarJSON<ConteudoAnotacao>(chave, r.conteudo)),
    })),
  )
  return anotacoes.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
}
