import { campoClasse, rotuloClasse } from './ui/Modal'

/** Campos da empresa, compartilhados entre o cadastro e a edição. */

export const EMPRESA_VAZIA = {
  razao_social: '',
  cnpj: '',
  inscricao_estadual: '',
  endereco: '',
  telefone: '',
  email: '',
  contato_nome: '',
}

/** Telefone com DDD ganha o código do país, como o backend espera */
function prepararTelefone(valor) {
  const digitos = String(valor || '').replace(/\D/g, '')
  if (!digitos) return null
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`
  return digitos
}

export function montarPayloadEmpresa(form) {
  return {
    razao_social: form.razao_social.trim(),
    cnpj: form.cnpj.trim(),
    inscricao_estadual: form.inscricao_estadual.trim() || null,
    endereco: form.endereco.trim() || null,
    telefone: prepararTelefone(form.telefone),
    email: form.email.trim() || null,
    contato_nome: form.contato_nome.trim() || null,
  }
}

export function empresaParaForm(empresa) {
  return {
    razao_social: empresa.razao_social ?? empresa.nome ?? '',
    cnpj: empresa.cnpj ?? '',
    inscricao_estadual: empresa.inscricao_estadual ?? '',
    endereco: empresa.endereco ?? '',
    telefone: empresa.telefone ?? '',
    email: empresa.email ?? '',
    contato_nome: empresa.contato_nome ?? '',
  }
}

function Secao({ icone, titulo, semCartao, children }) {
  if (semCartao) {
    return (
      <div className="space-y-5">
        <h4 className="text-sm font-bold uppercase tracking-wide text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary">
            {icone}
          </span>
          {titulo}
        </h4>
        {children}
      </div>
    )
  }

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

export default function FormularioEmpresa({ form, setForm, semCartao = false }) {
  const mudar = (campo) => (e) =>
    setForm((atual) => ({ ...atual, [campo]: e.target.value }))

  return (
    <>
      <Secao icone="apartment" titulo="Dados corporativos e fiscais" semCartao={semCartao}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={rotuloClasse}>Razão social</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Cargill Agrícola S/A"
              value={form.razao_social}
              onChange={mudar('razao_social')}
              className={campoClasse}
            />
          </div>

          <div>
            <label className={rotuloClasse}>CNPJ</label>
            <input
              type="text"
              required
              placeholder="00.000.000/0000-00"
              value={form.cnpj}
              onChange={mudar('cnpj')}
              className={`${campoClasse} font-mono`}
            />
          </div>

          <div>
            <label className={rotuloClasse}>Inscrição estadual</label>
            <input
              type="text"
              placeholder="Ex: 13.002.576-9"
              value={form.inscricao_estadual}
              onChange={mudar('inscricao_estadual')}
              className={`${campoClasse} font-mono`}
            />
          </div>
        </div>

        <div>
          <label className={rotuloClasse}>Endereço da sede ou filial</label>
          <input
            type="text"
            placeholder="Ex: Av. das Indústrias, 1500 - Rondonópolis, MT"
            value={form.endereco}
            onChange={mudar('endereco')}
            className={campoClasse}
          />
        </div>
      </Secao>

      <Secao icone="contacts" titulo="Contatos da mesa" semCartao={semCartao}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={rotuloClasse}>Telefone geral</label>
            <input
              type="text"
              placeholder="(66) 3456-7890"
              value={form.telefone}
              onChange={mudar('telefone')}
              className={campoClasse}
            />
          </div>

          <div>
            <label className={rotuloClasse}>E-mail corporativo</label>
            <input
              type="email"
              placeholder="originacao@trading.com.br"
              value={form.email}
              onChange={mudar('email')}
              className={campoClasse}
            />
          </div>

          <div>
            <label className={rotuloClasse}>Contato principal</label>
            <input
              type="text"
              placeholder="Ex: Mesa de Soja MT"
              value={form.contato_nome}
              onChange={mudar('contato_nome')}
              className={campoClasse}
            />
          </div>
        </div>
      </Secao>
    </>
  )
}
