import { describe, expect, it } from 'vitest'
import {
  abrirCofreComRecuperacao,
  abrirCofreComSenha,
  cifrarJSON,
  criarCofre,
  decifrarJSON,
  ErroSenhaIncorreta,
  gerarChaveRecuperacao,
  normalizarChaveRecuperacao,
  trocarSenha,
} from './cripto'

describe('cripto', () => {
  it('cifra e decifra um objeto com a chave dos dados', async () => {
    const { chaveDados } = await criarCofre('senha-forte-123')
    const env = await cifrarJSON(chaveDados, { nome: 'Lucas', idade: 8 })

    expect(env.ct).not.toContain('Lucas')
    expect(await decifrarJSON(chaveDados, env)).toEqual({ nome: 'Lucas', idade: 8 })
  })

  it('abre o cofre com a senha correta e recusa a incorreta', async () => {
    const { cofre, chaveDados } = await criarCofre('senha-forte-123')
    const env = await cifrarJSON(chaveDados, 'segredo')

    const reaberta = await abrirCofreComSenha(cofre, 'senha-forte-123')
    expect(await decifrarJSON(reaberta, env)).toBe('segredo')
    await expect(abrirCofreComSenha(cofre, 'errada')).rejects.toBeInstanceOf(ErroSenhaIncorreta)
  })

  it('abre o cofre com a chave de recuperação, mesmo digitada de outro jeito', async () => {
    const { cofre, chaveDados, chaveRecuperacao } = await criarCofre('senha-forte-123')
    const env = await cifrarJSON(chaveDados, 'segredo')
    const digitada = chaveRecuperacao.toLowerCase().replaceAll('-', ' ')

    const reaberta = await abrirCofreComRecuperacao(cofre, digitada)
    expect(await decifrarJSON(reaberta, env)).toBe('segredo')
  })

  it('troca a senha sem perder os dados', async () => {
    const { cofre, chaveDados } = await criarCofre('senha-antiga')
    const env = await cifrarJSON(chaveDados, 'segredo')

    const novoCofre = await trocarSenha(cofre, chaveDados, 'senha-nova')
    const reaberta = await abrirCofreComSenha(novoCofre, 'senha-nova')
    expect(await decifrarJSON(reaberta, env)).toBe('segredo')
    await expect(abrirCofreComSenha(novoCofre, 'senha-antiga')).rejects.toBeInstanceOf(
      ErroSenhaIncorreta,
    )
  })

  it('gera chaves de recuperação no formato XXXX-XXXX (8 grupos) e diferentes entre si', () => {
    const a = gerarChaveRecuperacao()
    const b = gerarChaveRecuperacao()
    expect(a).toMatch(/^([0-9A-HJKMNP-TV-Z]{4}-){7}[0-9A-HJKMNP-TV-Z]{4}$/)
    expect(a).not.toBe(b)
    expect(normalizarChaveRecuperacao(a)).toHaveLength(32)
  })
})
