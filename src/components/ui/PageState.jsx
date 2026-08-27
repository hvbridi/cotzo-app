/**
 * Estados compartilhados de lista: carregando, erro e vazio.
 * Padroniza as mensagens que hoje estão escritas à mão em cada página.
 */

/** Linhas cinza pulsando — melhor que "Carregando..." porque não muda a altura da tela */
export function SkeletonTabela({ linhas = 5, colunas = 5 }) {
  return (
    <div className="p-6 space-y-3" aria-busy="true" aria-label="Carregando registros">
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: colunas }).map((_, j) => (
            <div
              key={j}
              className="h-4 rounded bg-surface-variant animate-pulse"
              style={{
                width: j === 0 ? '10%' : j === colunas - 1 ? '15%' : '25%',
                animationDelay: `${i * 60}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCards({ quantidade = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: quantidade }).map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-2xl bg-surface-variant animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  )
}

export function EstadoErro({ mensagem, onTentarNovamente }) {
  return (
    <div className="p-12 text-center font-body">
      <span className="material-symbols-outlined text-4xl text-error mb-3 block">
        cloud_off
      </span>
      <p className="text-on-surface font-semibold mb-1">Não foi possível carregar</p>
      <p className="text-on-surface-variant text-sm max-w-md mx-auto">
        {mensagem || 'Verifique sua conexão e tente novamente.'}
      </p>
      {onTentarNovamente && (
        <button
          onClick={onTentarNovamente}
          className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}

/** Tela vazia é convite para agir, então recebe uma ação em vez de só informar */
export function EstadoVazio({ icone = 'inbox', titulo, descricao, acao }) {
  return (
    <div className="p-12 text-center font-body">
      <span className="material-symbols-outlined text-4xl text-outline mb-3 block">
        {icone}
      </span>
      <p className="text-on-surface font-semibold mb-1">{titulo}</p>
      {descricao && (
        <p className="text-on-surface-variant text-sm max-w-md mx-auto">{descricao}</p>
      )}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  )
}

/**
 * Wrapper que decide o que renderizar. Evita a escada de
 * `carregando ? ... : erro ? ... : vazio ? ... : conteúdo` repetida em cada página.
 */
export function EstadoLista({
  carregando,
  erro,
  vazio,
  onTentarNovamente,
  skeleton,
  vazioProps,
  children,
}) {
  if (carregando) return skeleton || <SkeletonTabela />
  if (erro) {
    return <EstadoErro mensagem={erro.message} onTentarNovamente={onTentarNovamente} />
  }
  if (vazio) return <EstadoVazio {...vazioProps} />
  return children
}
