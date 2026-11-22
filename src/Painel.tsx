import { useState } from 'react'
import {
  ITENS,
  SENHA_PAINEL,
  brl,
  idCurto,
  rotuloCobranca,
  type Bloqueio,
  type Categoria,
  type Cobranca,
  type Item,
  type Reserva,
  type Status,
} from './data'

const fmt = (d: string) => d.split('-').reverse().join('/')
const CATEGORIAS: Categoria[] = ['Decoração', 'Móveis', 'Itens de Festa']
const soDigitos = (t: string) => t.replace(/\D/g, '')

/** Reduz a foto enviada para caber no armazenamento do navegador. */
function reduzirFoto(arquivo: File): Promise<string> {
  return new Promise((ok, falha) => {
    const leitor = new FileReader()
    leitor.onerror = () => falha(new Error('Não foi possível ler a foto.'))
    leitor.onload = () => {
      const img = new Image()
      img.onerror = () => falha(new Error('Arquivo de imagem inválido.'))
      img.onload = () => {
        const max = 900
        const esc = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * esc)
        c.height = Math.round(img.height * esc)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        ok(c.toDataURL('image/jpeg', 0.82))
      }
      img.src = String(leitor.result)
    }
    leitor.readAsDataURL(arquivo)
  })
}

interface Props {
  reservas: Reserva[]
  onStatus: (id: string, s: Status) => void
  itens: Item[]
  setItens: (f: (i: Item[]) => Item[]) => void
  bloqueios: Bloqueio[]
  setBloqueios: (f: (b: Bloqueio[]) => Bloqueio[]) => void
  onComprovante: (r: Reserva) => void
}

export default function Painel({ reservas, onStatus, itens, setItens, bloqueios, setBloqueios, onComprovante }: Props) {
  const [logado, setLogado] = useState(() => {
    try {
      return sessionStorage.getItem('fp-painel') === '1'
    } catch {
      return false
    }
  })
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState<'todos' | Status>('todos')
  const [bl, setBl] = useState({ inicio: '', fim: '', motivo: '' })
  const [avisoBl, setAvisoBl] = useState('')
  const [msgFoto, setMsgFoto] = useState('')

  function entrar(e: React.FormEvent) {
    e.preventDefault()
    if (senha === SENHA_PAINEL) {
      try {
        sessionStorage.setItem('fp-painel', '1')
      } catch {
        /* segue sem lembrar o login */
      }
      setLogado(true)
      setErro('')
    } else {
      setErro('Senha incorreta.')
    }
  }

  function sair() {
    try {
      sessionStorage.removeItem('fp-painel')
    } catch {
      /* nada */
    }
    setLogado(false)
    setSenha('')
  }

  if (!logado) {
    return (
      <main className="secao login">
        <p className="eyebrow">Painel</p>
        <h2>Área da locadora</h2>
        <p className="sub">Entre com a senha para gerenciar pedidos, itens e datas.</p>
        <form className="caixa login-caixa" onSubmit={entrar}>
          <label>
            Senha
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" autoFocus />
          </label>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button className="btn cheio" type="submit">Entrar</button>
        </form>
      </main>
    )
  }

  const pend = reservas.filter((r) => r.status === 'pendente').length
  const apr = reservas.filter((r) => r.status === 'aprovada')
  const lista = reservas.filter((r) => filtro === 'todos' || r.status === filtro)
  const nomeItem = (id: string) => itens.find((x) => x.id === id)?.nome ?? 'Item removido'

  function editar(id: string, campos: Partial<Item>) {
    setItens((l) => l.map((i) => (i.id === id ? { ...i, ...campos } : i)))
  }

  function novoItem() {
    const id = `item-${Date.now().toString(36)}`
    setItens((l) => [
      ...l,
      { id, nome: 'Novo item', categoria: 'Decoração', emoji: '🎀', preco: 0, estoque: 1, descricao: 'Descreva o item.' },
    ])
  }

  function removerItem(i: Item) {
    if (window.confirm(`Remover "${i.nome}" do catálogo?`)) setItens((l) => l.filter((x) => x.id !== i.id))
  }

  async function enviarFoto(id: string, arq?: File) {
    if (!arq) return
    setMsgFoto('')
    try {
      editar(id, { foto: await reduzirFoto(arq) })
    } catch (e) {
      setMsgFoto(e instanceof Error ? e.message : 'Falha ao enviar a foto.')
    }
  }

  function restaurar() {
    if (window.confirm('Voltar todos os itens ao cadastro original? As edições serão perdidas.')) setItens(() => ITENS)
  }

  function addBloqueio(e: React.FormEvent) {
    e.preventDefault()
    if (!bl.inicio || !bl.fim) return setAvisoBl('Informe o início e o fim.')
    if (bl.fim < bl.inicio) return setAvisoBl('O fim não pode ser antes do início.')
    setBloqueios((l) => [...l, { id: `b-${Date.now().toString(36)}`, inicio: bl.inicio, fim: bl.fim, motivo: bl.motivo.trim() || 'Indisponível' }])
    setBl({ inicio: '', fim: '', motivo: '' })
    setAvisoBl('')
  }

  return (
    <main className="secao">
      <div className="painel-topo">
        <div>
          <p className="eyebrow">Painel</p>
          <h2>Área da locadora</h2>
        </div>
        <button className="btn pequeno sec" onClick={sair}>Sair</button>
      </div>
      <p className="sub">
        Ao aprovar, as datas ficam bloqueadas; ao recusar, os itens voltam ao estoque. Os dados ficam salvos
        neste navegador.
      </p>

      <div className="metricas">
        <div className="caixa"><span>Pendentes</span><strong>{pend}</strong></div>
        <div className="caixa"><span>Aprovados</span><strong>{apr.length}</strong></div>
        <div className="caixa"><span>Receita aprovada</span><strong>{brl(apr.reduce((s, r) => s + r.total, 0))}</strong></div>
      </div>

      <h3>Pedidos</h3>
      <div className="chips filtros-pedidos" role="group" aria-label="Filtrar pedidos">
        {(['todos', 'pendente', 'aprovada', 'recusada'] as const).map((f) => (
          <button key={f} className={f === filtro ? 'chip ativo' : 'chip'} aria-pressed={f === filtro} onClick={() => setFiltro(f)}>
            {f === 'todos' ? 'Todos' : f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {lista.length === 0 && <p className="vazio">Nenhum pedido {filtro === 'todos' ? 'ainda' : 'nesta situação'}.</p>}
      <div className="pedidos">
        {lista.map((r) => (
          <article key={r.id} className="caixa">
            <div className="linha-topo">
              <strong>{r.cliente} <small>#{idCurto(r.id)}</small></strong>
              <span className={`status ${r.status}`}>{r.status}</span>
            </div>
            <p>{fmt(r.inicio)} a {fmt(r.fim)} · {r.telefone} · <strong>{brl(r.total)}</strong></p>
            {r.entrega && (
              <p className="entrega-info">
                {r.entrega.tipo === 'retirada' ? 'Retirada na loja' : `Entrega (${r.entrega.regiao}): ${r.entrega.endereco ?? ''} · taxa ${brl(r.entrega.taxa)}`}
              </p>
            )}
            <p>Pagamento: {r.pagamento ?? '-'}</p>
            <ul>
              {r.itens.map((i) => (
                <li key={i.itemId}>{i.qtd}× {nomeItem(i.itemId)}</li>
              ))}
            </ul>
            <div className="acoes">
              {r.status === 'pendente' && (
                <>
                  <button className="btn pequeno" onClick={() => onStatus(r.id, 'aprovada')}>Aprovar</button>
                  <button className="btn pequeno sec" onClick={() => onStatus(r.id, 'recusada')}>Recusar</button>
                </>
              )}
              <a
                className="btn pequeno sec"
                href={`https://wa.me/${soDigitos(r.telefone).length <= 11 ? '55' : ''}${soDigitos(r.telefone)}?text=${encodeURIComponent(`Olá, ${r.cliente}! Sobre o seu pedido #${idCurto(r.id)} na Festa Perfeita:`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Chamar no WhatsApp
              </a>
              <button className="btn pequeno sec" onClick={() => onComprovante(r)}>Comprovante PDF</button>
            </div>
          </article>
        ))}
      </div>

      <h3>Datas bloqueadas</h3>
      <p className="sub">Marque dias em que a loja não aluga (feriados, manutenção, viagem). Eles aparecem como indisponíveis para os clientes.</p>
      <form className="painel-filtros bloqueio-form" onSubmit={addBloqueio}>
        <label>De<input type="date" value={bl.inicio} onChange={(e) => setBl({ ...bl, inicio: e.target.value })} /></label>
        <label>Até<input type="date" min={bl.inicio} value={bl.fim} onChange={(e) => setBl({ ...bl, fim: e.target.value })} /></label>
        <label className="grow">Motivo<input value={bl.motivo} onChange={(e) => setBl({ ...bl, motivo: e.target.value })} placeholder="Ex.: feriado, manutenção…" /></label>
        <button className="btn" type="submit">Bloquear</button>
      </form>
      {avisoBl && <p className="erro">{avisoBl}</p>}
      {bloqueios.length > 0 && (
        <ul className="lista-bloqueios">
          {[...bloqueios].sort((a, b) => a.inicio.localeCompare(b.inicio)).map((b) => (
            <li key={b.id}>
              <span><strong>{fmt(b.inicio)}{b.fim !== b.inicio ? ` a ${fmt(b.fim)}` : ''}</strong> · {b.motivo}</span>
              <button className="link" onClick={() => setBloqueios((l) => l.filter((x) => x.id !== b.id))}>remover</button>
            </li>
          ))}
        </ul>
      )}

      <div className="painel-topo itens-topo">
        <h3>Itens e estoque</h3>
        <div className="acoes">
          <button className="btn pequeno" onClick={novoItem}>+ Novo item</button>
          <button className="btn pequeno sec" onClick={restaurar}>Restaurar cadastro original</button>
        </div>
      </div>
      {msgFoto && <p className="erro" role="alert">{msgFoto}</p>}
      <div className="editor-itens">
        {itens.map((i) => (
          <article key={i.id} className="caixa item-edit">
            <div className="item-edit-foto">
              {i.foto ? <img src={i.foto} alt="" /> : <span aria-hidden>{i.emoji}</span>}
              <label className="btn pequeno sec arquivo">
                Trocar foto
                <input type="file" accept="image/*" onChange={(e) => { void enviarFoto(i.id, e.target.files?.[0]); e.target.value = '' }} />
              </label>
              {i.foto && <button className="link" onClick={() => editar(i.id, { foto: undefined })}>usar foto padrão</button>}
            </div>
            <div className="item-edit-campos">
              <label>Nome<input value={i.nome} onChange={(e) => editar(i.id, { nome: e.target.value })} /></label>
              <label>Descrição<input value={i.descricao} onChange={(e) => editar(i.id, { descricao: e.target.value })} /></label>
              <div className="linha-campos">
                <label>Categoria
                  <select value={i.categoria} onChange={(e) => editar(i.id, { categoria: e.target.value as Categoria })}>
                    {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label>Preço (R$)
                  <input type="number" min={0} step="0.01" value={i.preco} onChange={(e) => editar(i.id, { preco: Math.max(0, Number(e.target.value) || 0) })} />
                </label>
                <label>Cobrança
                  <select value={i.cobranca ?? 'dia'} onChange={(e) => editar(i.id, { cobranca: e.target.value as Cobranca })}>
                    <option value="dia">Por dia</option>
                    <option value="locacao">Por locação</option>
                  </select>
                </label>
                <label>Estoque
                  <input type="number" min={0} step="1" value={i.estoque} onChange={(e) => editar(i.id, { estoque: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
                </label>
              </div>
              <div className="item-edit-rodape">
                <span>{brl(i.preco)} <small>{rotuloCobranca(i)}</small></span>
                <button className="link perigo" onClick={() => removerItem(i)}>remover item</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
