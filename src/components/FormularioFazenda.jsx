import { Link } from 'react-router-dom'
import { campoClasse, rotuloClasse } from './ui/Modal'

/**
 * Campos da fazenda, compartilhados entre o cadastro e o modal de edição.
 * O PUT /fazendas/{id} aceita os mesmos 10 campos do POST, então não faz
 * sentido manter dois formulários diferentes.
 */

export const FAZENDA_VAZIA = {
  produtor_id: '',
  nome: '',
  municipio: '',
  inscricao_estadual: '',
  telefone: '',
  condicao_frete: 'FOB Fazenda',
  capacidade_carregamento: '',
  comprimento_balanca: '',
  coordenadas: '',
  descricao_roteiro: '',
}

/** Converte os campos de texto do formulário no payload que a API espera */
export function montarPayloadFazenda(form) {
  return {
    nome: form.nome.trim(),
    produtor_id: Number(form.produtor_id),
    municipio: form.municipio.trim() || null,
    inscricao_estadual: form.inscricao_estadual.trim() || null,
    telefone: form.telefone ? form.telefone.replace(/\D/g, '') : null,
    condicao_frete: form.condicao_frete || null,
    capacidade_carregamento: form.capacidade_carregamento
      ? Number(form.capacidade_carregamento)
      : null,
    comprimento_balanca: form.comprimento_balanca
      ? Number(form.comprimento_balanca)
      : null,
    coordenadas: form.coordenadas.trim() || null,
    descricao_roteiro: form.descricao_roteiro.trim() || null,
  }
}

/** Preenche o formulário a partir de uma fazenda vinda da API */
export function fazendaParaForm(fazenda) {
  return {
    produtor_id: fazenda.produtor_id ?? '',
    nome: fazenda.nome ?? '',
    municipio: fazenda.municipio ?? '',
    inscricao_estadual: fazenda.inscricao_estadual ?? '',
    telefone: fazenda.telefone ?? '',
    condicao_frete: fazenda.condicao_frete || 'FOB Fazenda',
    capacidade_carregamento: fazenda.capacidade_carregamento ?? '',
    comprimento_balanca: fazenda.comprimento_balanca ?? '',
    coordenadas: fazenda.coordenadas ?? '',
    descricao_roteiro: fazenda.descricao_roteiro ?? '',
  }
}

function Secao({ icone, titulo, children }) {
  return (
    <section className="bg-surface-bright rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-5 font-body">
      <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant/20">
        <span className="material-symbols-outlined text-primary">{icone}</span>
        <h3 className="text-lg font-headline font-bold text-on-surface">{titulo}</h3>
      </div>
      {children}
    </section>
  )
}

export default function FormularioFazenda({
  form,
  setForm,
  produtores = [],
  carregandoProdutores = false,
  semCartao = false,
}) {
  const mudar = (campo) => (e) =>
    setForm((atual) => ({ ...atual, [campo]: e.target.value }))

  // Dentro do modal o cartão duplicaria a moldura, então vira só um bloco
  const Envolver = semCartao
    ? ({ children }) => <div className="space-y-5">{children}</div>
    : Secao

  return (
    <>
      <Envolver icone="landscape" titulo="Identificação da propriedade">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={rotuloClasse}>Produtor proprietário</label>
            {carregandoProdutores ? (
              <div className="h-11 rounded-xl bg-surface-variant animate-pulse" />
            ) : produtores.length === 0 ? (
              <div className="p-3 bg-tertiary-container/40 text-on-tertiary-container text-xs rounded-xl">
                Nenhum produtor cadastrado.{' '}
                <Link to="/produtores" className="underline font-bold">
                  Cadastre um produtor primeiro.
                </Link>
              </div>
            ) : (
              <select
                required
                value={form.produtor_id}
                onChange={mudar('produtor_id')}
                className={campoClasse}
              >
                <option value="">Selecione o produtor...</option>
                {produtores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className={rotuloClasse}>Nome da fazenda</label>
            <input
              type="text"
              required
              placeholder="Ex: Fazenda Santa Maria - Lote B"
              value={form.nome}
              onChange={mudar('nome')}
              className={campoClasse}
            />
          </div>

          <div>
            <label className={rotuloClasse}>Município / UF</label>
            <input
              type="text"
              placeholder="Ex: Primavera do Leste - MT"
              value={form.municipio}
              onChange={mudar('municipio')}
              className={campoClasse}
            />
          </div>

          <div>
            <label className={rotuloClasse}>Inscrição estadual</label>
            <input
              type="text"
              placeholder="Ex: 13.456.789-0"
              value={form.inscricao_estadual}
              onChange={mudar('inscricao_estadual')}
              className={`${campoClasse} font-mono`}
            />
          </div>

          <div className="md:col-span-2">
            <label className={rotuloClasse}>Telefone da sede</label>
            <input
              type="text"
              placeholder="Ex: (66) 99988-7766"
              value={form.telefone}
              onChange={mudar('telefone')}
              className={campoClasse}
            />
          </div>
        </div>
      </Envolver>

      <Envolver icone="local_shipping" titulo="Logística e carregamento">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={rotuloClasse}>Condição de frete</label>
            <select
              value={form.condicao_frete}
              onChange={mudar('condicao_frete')}
              className={campoClasse}
            >
              <option value="FOB Fazenda">FOB Fazenda (retira na propriedade)</option>
              <option value="CIF Armazém">CIF Armazém (entregue no armazém)</option>
            </select>
          </div>

          <div>
            <label className={rotuloClasse}>Capacidade (ton/dia)</label>
            <input
              type="number"
              min="0"
              placeholder="Ex: 80"
              value={form.capacidade_carregamento}
              onChange={mudar('capacidade_carregamento')}
              className={campoClasse}
            />
          </div>

          <div>
            <label className={rotuloClasse}>Balança (metros)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ex: 30"
              value={form.comprimento_balanca}
              onChange={mudar('comprimento_balanca')}
              className={campoClasse}
            />
            <p className="text-xs text-secondary mt-1.5">
              Deixe vazio se a fazenda não tem balança.
            </p>
          </div>
        </div>
      </Envolver>

      <Envolver icone="explore" titulo="Localização e roteiro de acesso">
        <div>
          <label className={rotuloClasse}>Coordenadas GPS</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: -15.556214, -54.298115"
              value={form.coordenadas}
              onChange={mudar('coordenadas')}
              className={`${campoClasse} font-mono`}
            />
            {form.coordenadas && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  form.coordenadas
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 bg-surface-container-high hover:bg-surface-variant text-primary font-bold text-xs rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-base">map</span>
                Ver mapa
              </a>
            )}
          </div>
        </div>

        <div>
          <label className={rotuloClasse}>Roteiro até a sede</label>
          <textarea
            rows={4}
            placeholder="Ex: Saindo de Primavera pela MT-130 sentido Paranatinga, rodar 25km de asfalto, entrar à direita no KM 25 (placa Fazenda SM), seguir mais 14km de terra até a sede com balança."
            value={form.descricao_roteiro}
            onChange={mudar('descricao_roteiro')}
            className={`${campoClasse} resize-y leading-relaxed`}
          />
          <p className="text-xs text-secondary mt-1.5">
            Estas instruções vão para o caminhoneiro no dia do carregamento.
          </p>
        </div>
      </Envolver>
    </>
  )
}
