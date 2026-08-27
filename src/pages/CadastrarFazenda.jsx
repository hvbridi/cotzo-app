import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProdutores, useCriarFazenda } from '../services/queries'
import FormularioFazenda, {
  FAZENDA_VAZIA,
  montarPayloadFazenda,
} from '../components/FormularioFazenda'
import { useToast } from '../components/ui/Feedback'

export default function CadastrarFazenda() {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(FAZENDA_VAZIA)

  const { data: produtores = [], isLoading: carregandoProdutores } = useProdutores()

  const criar = useCriarFazenda({
    onSuccess: () => {
      toast.sucesso('Fazenda cadastrada.')
      navigate('/fazendas')
    },
    onError: (err) => toast.erro(err.message),
  })

  const salvar = (e) => {
    e.preventDefault()
    if (!form.produtor_id) {
      toast.aviso('Selecione o produtor proprietário.')
      return
    }
    criar.mutate(montarPayloadFazenda(form))
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
          <Link to="/fazendas" className="hover:text-primary transition-colors">
            Fazendas
          </Link>
          <span className="material-symbols-outlined text-base">chevron_right</span>
          <span className="text-primary font-medium">Nova fazenda</span>
        </nav>
        <h2 className="text-3xl font-headline font-semibold text-on-surface mb-1">
          Cadastrar nova fazenda
        </h2>
        <p className="text-secondary text-lg">
          Registre a propriedade e suas especificações logísticas.
        </p>
      </div>

      <form onSubmit={salvar} className="max-w-4xl space-y-6">
        <FormularioFazenda
          form={form}
          setForm={setForm}
          produtores={produtores}
          carregandoProdutores={carregandoProdutores}
        />

        <div className="flex items-center justify-end gap-3 font-body">
          <button
            type="button"
            disabled={criar.isPending}
            onClick={() => navigate('/fazendas')}
            className="px-6 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold text-sm hover:bg-surface-container-low transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={criar.isPending || produtores.length === 0}
            className="px-7 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-base">save</span>
            {criar.isPending ? 'Salvando...' : 'Salvar fazenda'}
          </button>
        </div>
      </form>
    </div>
  )
}