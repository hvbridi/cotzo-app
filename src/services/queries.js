import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { api, ApiError, lerTokenLocal } from './api'

/**
 * Chaves de cache centralizadas.
 * Toda página que precisa de produtores usa QK.produtores — por isso o dado
 * é buscado UMA vez e reaproveitado nas telas seguintes sem loading.
 */
export const QK = {
  perfil: ['perfil'],
  usuarios: ['usuarios'],
  produtores: ['produtores'],
  fazendas: ['fazendas'],
  empresas: ['empresas'],
  compradores: ['compradores'],
  contratos: ['contratos'],
  ofertas: ['ofertas'],
  historicos: ['historicos'],
  whatsapp: ['whatsapp', 'qrcode'],
}

// Dados de cadastro mudam pouco: 10 min "frescos", 30 min no cache.
const CADASTRO = { staleTime: 1000 * 60 * 10, gcTime: 1000 * 60 * 30 }
// Dados transacionais: 2 min.
const TRANSACIONAL = { staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 30 }

// ============================================================
// PERFIL E USUÁRIOS
// ============================================================

/**
 * Perfil do usuário logado, com três níveis de tentativa.
 *
 * O ideal é GET /usuarios/me. Só que essa rota nem sempre está disponível
 * (a API publicada pode estar atrás do main.py local), e sem perfil o topo
 * da tela fica travado em "Carregando...". Por isso existem os fallbacks —
 * eles vinham copiados em 12 páginas e agora moram só aqui.
 *
 * 1. GET /usuarios/me            -> dado completo
 * 2. GET /usuarios/ + e-mail     -> funciona para admin e gerente
 * 3. payload do próprio JWT      -> sempre funciona; nome vira o e-mail
 */
async function buscarPerfil() {
  const tokenPayload = lerTokenLocal()
  const email = tokenPayload?.sub || ''

  // 1
  try {
    return await api.get('/usuarios/me')
  } catch (erro) {
    // 401 já derruba a sessão no apiFetch; qualquer outro caso segue no fallback
    if (erro instanceof ApiError && erro.status === 401) throw erro
  }

  // 2
  if (email) {
    try {
      const usuarios = await api.get('/usuarios/')
      const encontrado = usuarios.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      )
      if (encontrado) return encontrado
    } catch {
      // corretor recebe 403 aqui — segue para o nível 3
    }
  }

  // 3
  return {
    id: tokenPayload?.id ?? null,
    nome: email ? email.split('@')[0] : 'Usuário',
    email,
    cargo: tokenPayload?.cargo || '',
  }
}

export function usePerfil() {
  const { data, ...resto } = useQuery({
    queryKey: QK.perfil,
    queryFn: buscarPerfil,
    staleTime: Infinity, // o perfil não muda sozinho; invalidamos na edição
    gcTime: Infinity,
    retry: false,
  })

  return {
    perfil: data ?? { nome: '', cargo: '', id: null },
    ehAdmin: data?.cargo === 'admin',
    ehGerente: data?.cargo === 'gerente',
    ehCorretor: data?.cargo === 'corretor',
    podeGerenciar: data?.cargo === 'admin' || data?.cargo === 'gerente',
    ...resto,
  }
}

/**
 * Corretor recebe 403 aqui. Em vez de tratar como erro (e fazer o React Query
 * tentar de novo), devolvemos lista vazia — quem chama decide o que mostrar.
 */
export function useUsuarios() {
  return useQuery({
    queryKey: QK.usuarios,
    queryFn: async () => {
      try {
        return await api.get('/usuarios/')
      } catch (erro) {
        if (erro instanceof ApiError && erro.status === 403) return []
        throw erro
      }
    },
    retry: false,
    ...CADASTRO,
  })
}

// ============================================================
// CADASTROS
// ============================================================

export function useProdutores({ enabled = true } = {}) {
  return useQuery({
    queryKey: QK.produtores,
    queryFn: () => api.get('/produtores/'),
    enabled,
    ...CADASTRO,
  })
}

/**
 * O backend não tem GET /fazendas/ — só GET /produtores/{id}/fazendas.
 * Então montamos a lista completa aqui: 1 requisição para produtores +
 * 1 por produtor. Parece caro, mas acontece UMA vez por sessão e fica em cache;
 * Fazendas, DetalhesFazenda, Ofertas e NovoFechamento leem todas do mesmo lugar.
 *
 * Quando o backend expuser GET /fazendas/, só o corpo desta função muda.
 * Nenhuma página precisa ser tocada.
 */
export function useFazendas() {
  return useQuery({
    queryKey: QK.fazendas,
    queryFn: async () => {
      const produtores = await api.get('/produtores/')

      const listas = await Promise.all(
        produtores.map(async (p) => {
          try {
            const fazendas = await api.get(`/produtores/${p.id}/fazendas`)
            return fazendas.map((f) => ({
              ...f,
              produtor_nome: p.nome,
              produtor_whatsapp: p.whatsapp,
            }))
          } catch {
            return [] // um produtor sem fazendas não pode derrubar a tela inteira
          }
        })
      )

      return listas.flat()
    },
    ...CADASTRO,
  })
}

/**
 * Lê a contagem de fazendas SÓ do cache, sem disparar requisição.
 * Serve para telas que querem exibir o número se ele já estiver por perto,
 * mas não podem pagar o custo do N+1 só por causa disso.
 */
export function useFazendasEmCache() {
  const qc = useQueryClient()
  return qc.getQueryData(QK.fazendas) ?? null
}

/** Filtra do cache de fazendas — não gera requisição nova. */
export function useFazendasDoProdutor(produtorId) {
  const { data: todas = [], ...resto } = useFazendas()

  const fazendas = useMemo(() => {
    if (!produtorId) return []
    return todas.filter((f) => String(f.produtor_id) === String(produtorId))
  }, [todas, produtorId])

  return { data: fazendas, ...resto }
}

export function useEmpresas({ enabled = true } = {}) {
  return useQuery({
    queryKey: QK.empresas,
    queryFn: () => api.get('/empresas/'),
    enabled,
    ...CADASTRO,
  })
}

export function useCompradores() {
  return useQuery({
    queryKey: QK.compradores,
    queryFn: () => api.get('/compradores/'),
    ...CADASTRO,
  })
}

export function useCompradoresDaEmpresa(empresaId) {
  const { data: todos = [], ...resto } = useCompradores()

  const compradores = useMemo(() => {
    if (!empresaId) return []
    return todos.filter((c) => String(c.empresa_id) === String(empresaId))
  }, [todos, empresaId])

  return { data: compradores, ...resto }
}

/**
 * Contagens para a Central de Cadastros.
 *
 * `enabled: false` faz o hook apenas OBSERVAR o cache: ele devolve o dado se
 * já existir e re-renderiza quando outra tela preencher, mas nunca dispara
 * requisição. Sem isso, abrir o hub acionaria o N+1 do useFazendas e a
 * navegação ficaria travada esperando dezenas de chamadas.
 */
export function useContagemCadastros() {
  const produtores = useQuery({ queryKey: QK.produtores, enabled: false })
  const fazendas = useQuery({ queryKey: QK.fazendas, enabled: false })
  const empresas = useQuery({ queryKey: QK.empresas, enabled: false })

  return {
    produtores: produtores.data?.length,
    fazendas: fazendas.data?.length,
    empresas: empresas.data?.length,
  }
}

// ============================================================
// TRANSACIONAL
// ============================================================

export function useContratos() {
  return useQuery({
    queryKey: QK.contratos,
    queryFn: () => api.get('/contratos/'),
    ...TRANSACIONAL,
  })
}

export function useOfertas() {
  return useQuery({
    queryKey: QK.ofertas,
    queryFn: () => api.get('/ofertas/'),
    ...TRANSACIONAL,
  })
}

export function useHistoricos(habilitado = true) {
  return useQuery({
    queryKey: QK.historicos,
    queryFn: async () => {
      try {
        return await api.get('/historicos/')
      } catch (erro) {
        if (erro instanceof ApiError && erro.status === 403) return []
        throw erro
      }
    },
    enabled: habilitado,
    retry: false,
    ...TRANSACIONAL,
  })
}

/**
 * QR Code de pareamento do WhatsApp (admin e gerente).
 * Nunca fica em cache: o código muda a cada leitura e expira em segundos.
 */
export function useQrCodeWhatsapp(habilitado = false) {
  return useQuery({
    queryKey: QK.whatsapp,
    queryFn: () => api.get('/conectar-whatsapp'),
    enabled: habilitado,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnMount: 'always',
  })
}

// ============================================================
// ENRIQUECIMENTO (join no cliente)
// ============================================================

function criarIndice(lista, campoNome) {
  const mapa = new Map()
  for (const item of lista) mapa.set(item.id, item[campoNome])
  return mapa
}

/**
 * O backend devolve contratos só com IDs. Aqui traduzimos para nomes usando
 * dados que já estão em cache — sem requisição extra.
 * Quando o backend passar a mandar produtor_nome etc., os campos originais
 * têm prioridade e este join vira apenas um fallback.
 */
export function useContratosEnriquecidos() {
  const contratos = useContratos()
  const { data: produtores = [] } = useProdutores()
  const { data: fazendas = [] } = useFazendas()
  const { data: empresas = [] } = useEmpresas()
  const { data: usuarios = [] } = useUsuarios()
  const { perfil } = usePerfil()

  const data = useMemo(() => {
    const lista = contratos.data ?? []
    const idxProdutor = criarIndice(produtores, 'nome')
    const idxFazenda = criarIndice(fazendas, 'nome')
    const idxEmpresa = criarIndice(empresas, 'razao_social')
    const idxUsuario = criarIndice(usuarios, 'nome')

    return lista.map((c) => ({
      ...c,
      produtor_nome:
        c.produtor_nome || idxProdutor.get(c.produtor_id) || 'Produtor removido',
      fazenda_nome:
        c.fazenda_nome || idxFazenda.get(c.fazenda_id) || 'Fazenda removida',
      empresa_nome:
        c.empresa_razao_social ||
        idxEmpresa.get(c.empresa_id) ||
        'Empresa removida',
      // Corretor só enxerga os próprios contratos, então quando /usuarios/
      // dá 403 o corretor do contrato é necessariamente ele mesmo.
      corretor_nome:
        c.corretor_nome ||
        idxUsuario.get(c.usuario_id) ||
        (c.usuario_id === perfil.id ? perfil.nome : '—'),
    }))
  }, [contratos.data, produtores, fazendas, empresas, usuarios, perfil])

  return { ...contratos, data }
}

export function useOfertasEnriquecidas() {
  const ofertas = useOfertas()
  const { data: produtores = [] } = useProdutores()
  const { data: fazendas = [] } = useFazendas()

  const data = useMemo(() => {
    const lista = ofertas.data ?? []
    const idxProdutor = criarIndice(produtores, 'nome')
    const idxFazenda = criarIndice(fazendas, 'nome')

    return lista.map((o) => ({
      ...o,
      produtor_nome:
        o.produtor_nome || idxProdutor.get(o.produtor_id) || 'Produtor removido',
      fazenda_nome:
        o.fazenda_nome || idxFazenda.get(o.fazenda_id) || 'Fazenda removida',
    }))
  }, [ofertas.data, produtores, fazendas])

  return { ...ofertas, data }
}

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Fábrica de mutations. O `invalida` garante que, depois de criar/editar/excluir,
 * as listas afetadas sejam recarregadas — resolve o problema oposto ao do loading:
 * cadastrar algo e a tela continuar mostrando dado velho.
 */
function criarMutation(fn, invalida = []) {
  return function useMutationGerada(opcoes = {}) {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: fn,
      ...opcoes,
      onSuccess: (dados, variaveis, contexto) => {
        invalida.forEach((chave) => qc.invalidateQueries({ queryKey: chave }))
        opcoes.onSuccess?.(dados, variaveis, contexto)
      },
    })
  }
}

// --- Produtores
export const useCriarProdutor = criarMutation(
  (corpo) => api.post('/produtores/', corpo),
  [QK.produtores, QK.fazendas]
)
export const useEditarProdutor = criarMutation(
  ({ id, ...corpo }) => api.put(`/produtores/${id}`, corpo),
  [QK.produtores, QK.fazendas, QK.contratos]
)
export const useExcluirProdutor = criarMutation(
  (id) => api.del(`/produtores/${id}`),
  [QK.produtores, QK.fazendas]
)

// --- Fazendas
export const useCriarFazenda = criarMutation(
  (corpo) => api.post('/fazendas/', corpo),
  [QK.fazendas]
)
export const useEditarFazenda = criarMutation(
  ({ id, ...corpo }) => api.put(`/fazendas/${id}`, corpo),
  [QK.fazendas, QK.contratos]
)
export const useExcluirFazenda = criarMutation(
  (id) => api.del(`/fazendas/${id}`),
  [QK.fazendas]
)

// --- Empresas
export const useCriarEmpresa = criarMutation(
  (corpo) => api.post('/empresas/', corpo),
  [QK.empresas]
)
export const useEditarEmpresa = criarMutation(
  ({ id, ...corpo }) => api.put(`/empresas/${id}`, corpo),
  [QK.empresas, QK.contratos]
)
export const useExcluirEmpresa = criarMutation(
  (id) => api.del(`/empresas/${id}`),
  [QK.empresas, QK.compradores]
)

// --- Compradores
export const useCriarComprador = criarMutation(
  (corpo) => api.post('/compradores/', corpo),
  [QK.compradores]
)
export const useEditarComprador = criarMutation(
  ({ id, ...corpo }) => api.put(`/compradores/${id}`, corpo),
  [QK.compradores]
)
export const useExcluirComprador = criarMutation(
  (id) => api.del(`/compradores/${id}`),
  [QK.compradores]
)

// --- Contratos
export const useCriarContrato = criarMutation(
  (corpo) => api.post('/contratos/', corpo),
  [QK.contratos, QK.historicos]
)
export const useEditarContrato = criarMutation(
  ({ id, ...corpo }) => api.put(`/contratos/${id}`, corpo),
  [QK.contratos, QK.historicos]
)
export const useExcluirContrato = criarMutation(
  (id) => api.del(`/contratos/${id}`),
  [QK.contratos, QK.historicos]
)

// --- Ofertas
export const useCriarOferta = criarMutation(
  (corpo) => api.post('/ofertas/', corpo),
  [QK.ofertas]
)
export const useEditarOferta = criarMutation(
  ({ id, ...corpo }) => api.put(`/ofertas/${id}`, corpo),
  [QK.ofertas]
)
export const useExcluirOferta = criarMutation(
  (id) => api.del(`/ofertas/${id}`),
  [QK.ofertas]
)

// --- Usuários
export const useCriarUsuario = criarMutation(
  (corpo) => api.post('/usuarios/', corpo),
  [QK.usuarios]
)
export const useEditarUsuario = criarMutation(
  ({ id, ...corpo }) => api.put(`/usuarios/${id}`, corpo),
  [QK.usuarios, QK.perfil]
)
export const useExcluirUsuario = criarMutation(
  (id) => api.del(`/usuarios/${id}`),
  [QK.usuarios]
)

/**
 * Pré-carrega os cadastros logo após o login, enquanto o Dashboard renderiza.
 * A partir daí a navegação entre telas é instantânea.
 */
export function usePrefetchGlobal() {
  const qc = useQueryClient()

  return () => {
    qc.prefetchQuery({ queryKey: QK.produtores, queryFn: () => api.get('/produtores/') })
    qc.prefetchQuery({ queryKey: QK.empresas, queryFn: () => api.get('/empresas/') })
    qc.prefetchQuery({ queryKey: QK.contratos, queryFn: () => api.get('/contratos/') })
  }
}