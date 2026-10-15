import type { RegistroLocal } from '../dados/db'

/** Registro como viaja no arquivo de estado de cada aparelho (sem o controle local). */
export type RegistroSinc = Omit<RegistroLocal, 'pendenteEnvio'>

/**
 * "A última edição vence". Em caso de empate exato no horário,
 * o identificador do aparelho desempata, para que todos os aparelhos cheguem ao mesmo resultado.
 */
export function ehMaisRecente(a: RegistroSinc, b: RegistroSinc): boolean {
  if (a.atualizadoEm !== b.atualizadoEm) return a.atualizadoEm > b.atualizadoEm
  return a.aparelho > b.aparelho
}

/**
 * Compara o que veio de outro aparelho com o que existe aqui
 * e devolve apenas os registros remotos que devem substituir (ou criar) os locais.
 */
export function mesclar(locais: RegistroSinc[], remotos: RegistroSinc[]): RegistroSinc[] {
  const porId = new Map(locais.map((r) => [r.id, r]))
  const vencedores = new Map<string, RegistroSinc>()

  for (const remoto of remotos) {
    const atual = vencedores.get(remoto.id) ?? porId.get(remoto.id)
    if (!atual || ehMaisRecente(remoto, atual)) vencedores.set(remoto.id, remoto)
  }
  return [...vencedores.values()]
}
