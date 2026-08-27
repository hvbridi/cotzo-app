import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCriarEmpresa } from '../services/queries'
import FormularioEmpresa, {
  EMPRESA_VAZIA,
  montarPayloadEmpresa,
} from '../components/FormularioEmpresa'
import { useToast } from '../components/ui/Feedback'

export default function CadastrarEmpresa() {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(EMPRESA_VAZIA)

  const criar = useCriarEmpresa({
    onSuccess: () => {
      toast.sucesso('Empresa cadastrada.')
      navigate('/empresas')
    },
    onError: (err) => toast.erro(err.message),
  })

  const salvar = (e) => {
    e.preventDefault()
    criar.mutate(montarPayloadEmpresa(form))
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Cabeçalho */}
      <div>
        <nav className="flex items-center gap-2 text-sm font-label text-on-surface-variant mb-2">
          <Link to="/cadastros" className="hover:text-primary transition-colors">
            Central de Cadastros
          </Link>
          <span className="material-symbols-outlined text-base">chevron_right</span>
          <Link to="/empresas" className="hover:text-primary transition-colors">
            Empresas
          </Link>
          <span className="material-symbols-outlined text-base">chevron_right</span>
          <span className="text-primary font-medium">Nova empresa</span>
        </nav>
        <h2 className="text-3xl font-headline font-semibold text-on-surface mb-1">
          Cadastrar empresa compradora
        </h2>
        <p className="text-secondary text-lg">
          Tradings, indústrias e demais compradoras de commodities.
        </p>
      </div>

      <form onSubmit={salvar} className="max-w-4xl space-y-6">
        <FormularioEmpresa form={form} setForm={setForm} />

        <div className="flex items-center justify-end gap-3 font-body">
          <button
            type="button"
            disabled={criar.isPending}
            onClick={() => navigate('/empresas')}
            className="px-6 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold text-sm hover:bg-surface-container-low transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={criar.isPending}
            className="px-7 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-base">save</span>
            {criar.isPending ? 'Salvando...' : 'Salvar empresa'}
          </button>
        </div>
      </form>
    </div>
  )
}