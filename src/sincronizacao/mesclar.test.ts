import { describe, expect, it } from 'vitest'
import { mesclar, type RegistroSinc } from './mesclar'

const env = { v: 1 as const, iv: '', ct: '' }

function reg(id: string, atualizadoEm: string, aparelho = 'A', excluido = false): RegistroSinc {
  return { id, atualizadoEm, aparelho, excluido, conteudo: env }
}

describe('mesclar', () => {
  it('traz registros que só existem no outro aparelho', () => {
    const novo = reg('1', '2026-10-14T10:00:00.000Z', 'B')
    expect(mesclar([], [novo])).toEqual([novo])
  })

  it('substitui o local quando o remoto é mais recente', () => {
    const local = reg('1', '2026-10-14T10:00:00.000Z', 'A')
    const remoto = reg('1', '2026-10-14T11:00:00.000Z', 'B')
    expect(mesclar([local], [remoto])).toEqual([remoto])
  })

  it('mantém o local quando ele é mais recente', () => {
    const local = reg('1', '2026-10-14T12:00:00.000Z', 'A')
    const remoto = reg('1', '2026-10-14T11:00:00.000Z', 'B')
    expect(mesclar([local], [remoto])).toEqual([])
  })

  it('propaga exclusões mais recentes', () => {
    const local = reg('1', '2026-10-14T10:00:00.000Z', 'A')
    const exclusao = reg('1', '2026-10-14T11:00:00.000Z', 'B', true)
    expect(mesclar([local], [exclusao])).toEqual([exclusao])
  })

  it('desempata pelo aparelho para que todos cheguem ao mesmo resultado', () => {
    const quando = '2026-10-14T10:00:00.000Z'
    const deA = reg('1', quando, 'A')
    const deB = reg('1', quando, 'B')
    expect(mesclar([deA], [deB])).toEqual([deB])
    expect(mesclar([deB], [deA])).toEqual([])
  })

  it('escolhe o mais recente entre vários aparelhos remotos', () => {
    const deB = reg('1', '2026-10-14T11:00:00.000Z', 'B')
    const deC = reg('1', '2026-10-14T12:00:00.000Z', 'C')
    expect(mesclar([], [deC, deB])).toEqual([deC])
  })
})
