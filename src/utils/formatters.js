/**
 * Formatadores compartilhados.
 * Substituem as cópias de getIniciais e formatarData espalhadas pelas páginas.
 */

/** Iniciais para o avatar: "Luís Miguel Ravanello" -> "LR" */
export function getIniciais(nome) {
  if (!nome || !nome.trim()) return '--'
  const partes = nome.trim().split(/\s+/)
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

/**
 * "2026-03-14" ou "2026-03-14T00:00:00" -> "14/03/2026"
 * Feito por string, de propósito: `new Date('2026-03-14')` é interpretado como UTC
 * e no fuso do Brasil volta um dia (mostraria 13/03).
 */
export function formatarData(valor) {
  if (!valor) return '—'
  const [ano, mes, dia] = String(valor).split('T')[0].split('-')
  if (!dia) return String(valor)
  return `${dia}/${mes}/${ano}`
}

/**
 * Fuso usado para exibir data e hora. Mato Grosso é UTC−4, uma hora atrás de
 * São Paulo. Trocar aqui muda o app inteiro.
 */
export const FUSO_EXIBICAO = 'America/Cuiaba'

/**
 * O backend grava o horário com fuso e o banco devolve em UTC.
 * Quando a string não traz fuso nenhum, assumimos UTC — foi o que os registros
 * do histórico mostraram na prática.
 */
function interpretarInstante(valor) {
  let texto = String(valor).trim()

  // O Python manda microssegundos; o JavaScript só aceita milissegundos
  texto = texto.replace(/(\.\d{3})\d+/, '$1')

  const temFuso = /(Z|[+-]\d{2}:?\d{2})$/.test(texto)
  return new Date(temFuso ? texto : `${texto}Z`)
}

/** "2026-03-14T18:42:11" (UTC) -> "14/03/2026 às 14:42" no fuso de Mato Grosso */
export function formatarDataHora(valor) {
  if (!valor) return '—'

  const instante = interpretarInstante(valor)
  if (Number.isNaN(instante.getTime())) return String(valor)

  const data = instante.toLocaleDateString('pt-BR', { timeZone: FUSO_EXIBICAO })
  const hora = instante.toLocaleTimeString('pt-BR', {
    timeZone: FUSO_EXIBICAO,
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${data} às ${hora}`
}

/** Só a hora, no fuso de exibição */
export function formatarHora(valor) {
  if (!valor) return '—'
  const instante = interpretarInstante(valor)
  if (Number.isNaN(instante.getTime())) return String(valor)
  return instante.toLocaleTimeString('pt-BR', {
    timeZone: FUSO_EXIBICAO,
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Data de hoje no formato aceito por <input type="date"> */
export function dataHoje() {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

export function formatarMoeda(valor, moeda = 'BRL') {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '—'
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: moeda === 'USD' ? 'USD' : 'BRL',
    minimumFractionDigits: 2,
  })
}

export function formatarNumero(valor, casas = 0) {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '—'
  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}

/** 1250000 -> "1,25 mi" — para os cards de métrica do Dashboard */
export function formatarCompacto(valor) {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '—'
  if (Math.abs(numero) >= 1_000_000) return `${formatarNumero(numero / 1_000_000, 2)} mi`
  if (Math.abs(numero) >= 1_000) return `${formatarNumero(numero / 1_000, 1)} mil`
  return formatarNumero(numero)
}

export function formatarCpfCnpj(valor) {
  const digitos = String(valor || '').replace(/\D/g, '')
  if (digitos.length === 11) {
    return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digitos.length === 14) {
    return digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return valor || '—'
}

export function formatarTelefone(valor) {
  const digitos = String(valor || '').replace(/\D/g, '')
  const semPais = digitos.startsWith('55') && digitos.length > 11 ? digitos.slice(2) : digitos
  if (semPais.length === 11) return semPais.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (semPais.length === 10) return semPais.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return valor || '—'
}

/** Normaliza para o formato que a Evolution API espera: 5544999998888 */
export function normalizarWhatsapp(valor) {
  const digitos = String(valor || '').replace(/\D/g, '')
  if (!digitos) return ''
  return digitos.startsWith('55') ? digitos : `55${digitos}`
}

/** Busca sem acento e sem caixa — usada nos filtros das tabelas */
export function normalizarBusca(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Classes do badge de status de contrato, seguindo a paleta do tema */
export function classesStatus(status) {
  const mapa = {
    Fechado: 'bg-primary-container/40 text-on-primary-fixed-variant',
    Emitido: 'bg-tertiary-container/40 text-on-tertiary-container',
    Concluído: 'bg-primary-container/60 text-on-primary-fixed-variant',
    Cancelado: 'bg-error-container text-on-error-container',
  }
  return mapa[status] || 'bg-surface-variant text-on-surface-variant'
}