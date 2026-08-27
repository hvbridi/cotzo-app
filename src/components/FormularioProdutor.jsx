import { campoClasse, rotuloClasse } from './ui/Modal'

/** Campos do produtor, compartilhados entre o cadastro e a edição. */

export const PRODUTOR_VAZIO = {
  nome: '',
  whatsapp: '',
  cpf_cnpj: '',
  cidade: '',
  uf: '',
}

export function montarPayloadProdutor(form) {
  return {
    nome: form.nome.trim(),
    whatsapp: form.whatsapp.trim(),
    cpf_cnpj: form.cpf_cnpj.trim() || null,
    cidade: form.cidade.trim() || null,
    uf: form.uf.trim().toUpperCase() || null,
  }
}

export function produtorParaForm(produtor) {
  return {
    nome: produtor.nome ?? '',
    whatsapp: produtor.whatsapp ?? '',
    cpf_cnpj: produtor.cpf_cnpj ?? '',
    cidade: produtor.cidade ?? '',
    uf: produtor.uf ?? '',
  }
}

export default function FormularioProdutor({ form, setForm }) {
  const mudar = (campo) => (e) =>
    setForm((atual) => ({ ...atual, [campo]: e.target.value }))

  return (
    <>
      <div>
        <label className={rotuloClasse}>Nome completo</label>
        <input
          type="text"
          required
          autoFocus
          value={form.nome}
          onChange={mudar('nome')}
          placeholder="Ex: João da Silva"
          className={campoClasse}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={rotuloClasse}>CPF / CNPJ</label>
          <input
            type="text"
            value={form.cpf_cnpj}
            onChange={mudar('cpf_cnpj')}
            placeholder="000.000.000-00"
            className={campoClasse}
          />
        </div>
        <div>
          <label className={rotuloClasse}>WhatsApp</label>
          <input
            type="text"
            required
            value={form.whatsapp}
            onChange={mudar('whatsapp')}
            placeholder="(00) 00000-0000"
            className={campoClasse}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className={rotuloClasse}>Cidade</label>
          <input
            type="text"
            value={form.cidade}
            onChange={mudar('cidade')}
            placeholder="Nome da cidade"
            className={campoClasse}
          />
        </div>
        <div>
          <label className={rotuloClasse}>UF</label>
          <input
            type="text"
            maxLength={2}
            value={form.uf}
            onChange={(e) =>
              setForm((atual) => ({ ...atual, uf: e.target.value.toUpperCase() }))
            }
            placeholder="UF"
            className={`${campoClasse} uppercase`}
          />
        </div>
      </div>
    </>
  )
}
