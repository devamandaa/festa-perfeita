import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  INSTAGRAM,
  ITENS,
  WHATSAPP,
  brl,
  dias,
  disponivel,
  type Categoria,
  type Item,
  type Reserva,
  type Status,
} from './data'

const CATEGORIAS: ('Todos' | Categoria)[] = ['Todos', 'Decoração', 'Móveis', 'Itens de Festa']
const fmt = (d: string) => d.split('-').reverse().join('/')
const hoje = () => new Date().toISOString().slice(0, 10)

function usePersistido<T>(chave: string, inicial: T) {
  const [valor, setValor] = useState<T>(() => {
    try {
      const s = localStorage.getItem(chave)
      return s ? (JSON.parse(s) as T) : inicial
    } catch {
      return inicial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor))
    } catch {
      /* sem armazenamento: segue sem persistir */
    }
  }, [chave, valor])
  return [valor, setValor] as const
}

/** Revela o elemento com animação quando entra na tela. */
function Revelar({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ver, setVer] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return setVer(true)
    const o = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVer(true)
          o.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    o.observe(el)
    return () => o.disconnect()
  }, [])
  return (
    <div ref={ref} className={`revelar ${ver ? 'visivel' : ''} ${className}`}>
      {children}
    </div>
  )
}

function Foto({ item, grande = false }: { item: Item; grande?: boolean }) {
  const [erro, setErro] = useState(false)
  return (
    <div className={`foto cat-${item.categoria === 'Itens de Festa' ? 'festa' : item.categoria === 'Móveis' ? 'moveis' : 'deco'} ${grande ? 'grande' : ''}`}>
      {!erro && (
        <img
          src={`/fotos/${item.id}.jpg`}
          alt={item.nome}
          loading="lazy"
          onError={() => setErro(true)}
        />
      )}
      {erro && (
        <span className="emoji" role="img" aria-label={item.nome}>
          {item.emoji}
        </span>
      )}
    </div>
  )
}

function Baloes() {
  return (
    <svg className="baloes" viewBox="0 0 420 460" aria-hidden>
      <defs>
        <radialGradient id="g1" cx="35%" cy="30%"><stop offset="0" stopColor="#a995f5" /><stop offset="1" stopColor="#5b3fd0" /></radialGradient>
        <radialGradient id="g2" cx="35%" cy="30%"><stop offset="0" stopColor="#8cc0ff" /><stop offset="1" stopColor="#2f6fed" /></radialGradient>
        <radialGradient id="g3" cx="35%" cy="30%"><stop offset="0" stopColor="#c9d6ff" /><stop offset="1" stopColor="#4f5fd6" /></radialGradient>
        <radialGradient id="g4" cx="35%" cy="30%"><stop offset="0" stopColor="#bfe6ff" /><stop offset="1" stopColor="#38a3e8" /></radialGradient>
      </defs>
      <g className="b b1"><path d="M215 250 C200 330 230 380 210 450" stroke="#4b2fb0" strokeWidth="2" fill="none" /><ellipse cx="215" cy="150" rx="82" ry="100" fill="url(#g1)" /><ellipse cx="185" cy="105" rx="14" ry="26" fill="#fff" opacity=".35" transform="rotate(25 185 105)" /><path d="M207 250 l8 12 l8 -12z" fill="#5b3fd0" /></g>
      <g className="b b2"><path d="M110 210 C120 300 190 350 210 450" stroke="#1f55c4" strokeWidth="2" fill="none" /><ellipse cx="100" cy="150" rx="62" ry="76" fill="url(#g2)" /><ellipse cx="80" cy="115" rx="10" ry="19" fill="#fff" opacity=".4" transform="rotate(25 80 115)" /></g>
      <g className="b b3"><path d="M330 220 C320 310 250 360 210 450" stroke="#3b2a8f" strokeWidth="2" fill="none" /><ellipse cx="330" cy="150" rx="62" ry="76" fill="url(#g3)" /><ellipse cx="310" cy="115" rx="10" ry="19" fill="#fff" opacity=".4" transform="rotate(25 310 115)" /></g>
      <g className="b b4"><path d="M270 80 C280 200 230 330 210 450" stroke="#1f7fc4" strokeWidth="2" fill="none" /><ellipse cx="275" cy="48" rx="42" ry="52" fill="url(#g4)" /><ellipse cx="262" cy="28" rx="7" ry="13" fill="#fff" opacity=".4" transform="rotate(25 262 28)" /></g>
    </svg>
  )
}

export default function App() {
  const [visao, setVisao] = useState<'loja' | 'painel'>('loja')
  const [reservas, setReservas] = usePersistido<Reserva[]>('fp-reservas', [])
  const [carrinho, setCarrinho] = useState<Record<string, number>>({})
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [busca, setBusca] = useState('')
  const [cat, setCat] = useState<'Todos' | Categoria>('Todos')
  const [ordem, setOrdem] = useState<'nome' | 'menor' | 'maior'>('nome')
  const [soDisp, setSoDisp] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [detalhe, setDetalhe] = useState<Item | null>(null)
  const [cliente, setCliente] = useState('')
  const [telefone, setTelefone] = useState('')
  const [aviso, setAviso] = useState('')
  const [toast, setToast] = useState('')
  const [sucesso, setSucesso] = useState<Reserva | null>(null)
  const [rolou, setRolou] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    const f = () => setRolou(window.scrollY > 8)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false)
        setDetalhe(null)
        setSucesso(null)
      }
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])

  const periodoOk = !!inicio && !!fim && fim >= inicio
  const qtdDias = periodoOk ? dias(inicio, fim) : 1

  const lista = useMemo(() => {
    const l = ITENS.filter(
      (i) =>
        (cat === 'Todos' || i.categoria === cat) &&
        i.nome.toLowerCase().includes(busca.toLowerCase()) &&
        (!soDisp || disponivel(i, reservas, inicio, fim) > 0),
    )
    return [...l].sort((a, b) =>
      ordem === 'nome' ? a.nome.localeCompare(b.nome) : ordem === 'menor' ? a.preco - b.preco : b.preco - a.preco,
    )
  }, [cat, busca, ordem, soDisp, reservas, inicio, fim])

  const linhas = Object.entries(carrinho)
    .filter(([, q]) => q > 0)
    .map(([id, qtd]) => {
      const item = ITENS.find((i) => i.id === id)!
      return { item, qtd, subtotal: item.preco * qtd * qtdDias }
    })
  const total = linhas.reduce((s, l) => s + l.subtotal, 0)
  const totalItens = linhas.reduce((s, l) => s + l.qtd, 0)

  function alterar(item: Item, delta: number) {
    const max = disponivel(item, reservas, inicio, fim)
    const atual = carrinho[item.id] ?? 0
    const novo = Math.min(max, Math.max(0, atual + delta))
    if (delta > 0 && novo === atual) return setToast(`Só temos ${max} unidade(s) de "${item.nome}" nesse período.`)
    setCarrinho((c) => ({ ...c, [item.id]: novo }))
    if (delta > 0 && atual === 0) setToast(`${item.nome} adicionado ao orçamento`)
  }

  function confirmar() {
    setAviso('')
    if (!periodoOk) return setAviso('Escolha o período da festa (início e fim).')
    if (!linhas.length) return setAviso('Adicione pelo menos um item.')
    if (!cliente.trim()) return setAviso('Informe seu nome.')
    if (telefone.replace(/\D/g, '').length < 10) return setAviso('Informe um WhatsApp válido com DDD.')
    for (const l of linhas) {
      if (l.qtd > disponivel(l.item, reservas, inicio, fim)) {
        return setAviso(`"${l.item.nome}" não tem mais ${l.qtd} unidade(s) nesse período.`)
      }
    }
    const nova: Reserva = {
      id: crypto.randomUUID(),
      itens: linhas.map((l) => ({ itemId: l.item.id, qtd: l.qtd })),
      inicio,
      fim,
      cliente: cliente.trim(),
      telefone: telefone.trim(),
      status: 'pendente',
      total,
    }
    setReservas((r) => [nova, ...r])
    setCarrinho({})
    setAberto(false)
    setSucesso(nova)
  }

  function linkWhats(r: Reserva) {
    const itens = r.itens
      .map((i) => `• ${i.qtd}x ${ITENS.find((x) => x.id === i.itemId)?.nome}`)
      .join('\n')
    const msg = `Olá! Fiz um pedido no site Festa Perfeita.\n\nNome: ${r.cliente}\nPeríodo: ${fmt(r.inicio)} a ${fmt(r.fim)}\n${itens}\nTotal: ${brl(r.total)}\nPedido nº ${r.id.slice(0, 6).toUpperCase()}`
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`
  }

  function mudarStatus(id: string, status: Status) {
    setReservas((r) => r.map((x) => (x.id === id ? { ...x, status } : x)))
  }

  function ir(v: 'loja' | 'painel') {
    setVisao(v)
    setMenu(false)
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <a className="pular" href="#catalogo">Pular para o catálogo</a>
      <header className={`topo ${rolou ? 'rolou' : ''}`}>
        <a className="marca" href="#inicio" onClick={() => ir('loja')}>
          <span className="marca-script">Festa</span> <span className="marca-caps">Perfeita</span>
        </a>
        <button className="hamb" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>
          <span /><span /><span />
        </button>
        <nav className={menu ? 'aberto' : ''}>
          {visao === 'loja' && (
            <>
              <a href="#catalogo" onClick={() => setMenu(false)}>Catálogo</a>
              <a href="#como" onClick={() => setMenu(false)}>Como funciona</a>
              <a href="#porque" onClick={() => setMenu(false)}>Vantagens</a>
              <a href="#duvidas" onClick={() => setMenu(false)}>Dúvidas</a>
            </>
          )}
          <button className="link" onClick={() => ir(visao === 'loja' ? 'painel' : 'loja')}>
            {visao === 'loja' ? 'Área da locadora' : '← Voltar à loja'}
          </button>
          {visao === 'loja' && (
            <button className="carrinho" onClick={() => { setAberto(true); setMenu(false) }}>
              Orçamento{totalItens > 0 && <span className="badge">{totalItens}</span>}
            </button>
          )}
        </nav>
      </header>

      {visao === 'painel' ? (
        <Painel reservas={reservas} onStatus={mudarStatus} />
      ) : (
        <main>
          <section className="hero" id="inicio">
            <span className="confete c1" /><span className="confete c2" /><span className="confete c3" /><span className="confete c4" />
            <div className="hero-texto">
              <p className="eyebrow">Aluguel de itens para decoração de festas</p>
              <h1>
                Tudo para sua festa ser <em>inesquecível!</em>
              </h1>
              <p className="lead">
                Escolha a data, veja na hora o que está disponível e receba seu orçamento sem
                complicação. Decoração, móveis e itens de festa em um só lugar.
              </p>
              <div className="hero-acoes">
                <a className="btn grande" href="#catalogo">Ver catálogo</a>
                <a className="btn grande sec" href="#como">Como funciona</a>
              </div>
              <ul className="selos">
                <li>✓ Disponibilidade por data</li>
                <li>✓ Sem dupla reserva</li>
                <li>✓ Orçamento na hora</li>
              </ul>
            </div>
            <div className="hero-arte">
              <Baloes />
            </div>
          </section>

          <section className="faixa" aria-label="Categorias">
            {[
              ['🎈', 'Decoração', 'Decoração'],
              ['🛋️', 'Móveis', 'Móveis'],
              ['🍽️', 'Itens de Festa', 'Itens de Festa'],
            ].map(([e, t, c]) => (
              <a key={t} href="#catalogo" className="faixa-item" onClick={() => setCat(c as Categoria)}>
                <span>{e}</span>
                <strong>{t}</strong>
              </a>
            ))}
            <a href="#catalogo" className="faixa-item" onClick={() => setCat('Todos')}>
              <span>⭐</span>
              <strong>E muito mais!</strong>
            </a>
          </section>

          <section id="catalogo" className="secao">
            <Revelar>
              <p className="eyebrow">Catálogo</p>
              <h2>Escolha seus itens</h2>
              <p className="sub">Informe o período da festa e veja a disponibilidade real de cada item.</p>
            </Revelar>
            <div className="painel-filtros">
              <label>
                Início da festa
                <input type="date" min={hoje()} value={inicio} onChange={(e) => { setInicio(e.target.value); if (fim && fim < e.target.value) setFim(e.target.value) }} />
              </label>
              <label>
                Fim da festa
                <input type="date" min={inicio || hoje()} value={fim} onChange={(e) => setFim(e.target.value)} />
              </label>
              <label className="grow">
                Buscar
                <input type="search" placeholder="Ex.: arco, mesa, taças…" value={busca} onChange={(e) => setBusca(e.target.value)} />
              </label>
              <label>
                Ordenar
                <select value={ordem} onChange={(e) => setOrdem(e.target.value as typeof ordem)}>
                  <option value="nome">Nome (A–Z)</option>
                  <option value="menor">Menor preço</option>
                  <option value="maior">Maior preço</option>
                </select>
              </label>
            </div>
            <div className="barra">
              <div className="chips" role="tablist">
                {CATEGORIAS.map((c) => (
                  <button key={c} className={c === cat ? 'chip ativo' : 'chip'} onClick={() => setCat(c)}>
                    {c}
                  </button>
                ))}
              </div>
              <label className="check">
                <input type="checkbox" checked={soDisp} onChange={(e) => setSoDisp(e.target.checked)} />
                Só disponíveis
              </label>
            </div>
            {periodoOk ? (
              <p className="periodo">📅 {fmt(inicio)} a {fmt(fim)} · {qtdDias} dia(s)</p>
            ) : (
              <p className="periodo dica">Escolha as datas para ver o que está livre e calcular o orçamento.</p>
            )}

            <div className="grade">
              {lista.map((item) => {
                const livre = disponivel(item, reservas, inicio, fim)
                const n = carrinho[item.id] ?? 0
                return (
                  <article key={item.id} className={livre === 0 ? 'card esgotado' : 'card'}>
                    <button className="card-foto" onClick={() => setDetalhe(item)} aria-label={`Detalhes de ${item.nome}`}>
                      <Foto item={item} />
                      <span className="tag">{item.categoria}</span>
                    </button>
                    <div className="card-corpo">
                      <h3>{item.nome}</h3>
                      <p className="desc">{item.descricao}</p>
                      <p className="preco">{brl(item.preco)} <small>/ dia</small></p>
                      <p className={livre === 0 ? 'disp nao' : livre <= 2 ? 'disp pouco' : 'disp'}>
                        <i />
                        {livre === 0 ? 'Indisponível no período' : livre <= 2 ? `Últimas ${livre} unidade(s)` : `${livre} disponíveis`}
                      </p>
                      {n === 0 ? (
                        <button className="btn pequeno cheio" disabled={livre === 0} onClick={() => alterar(item, 1)}>
                          Adicionar ao orçamento
                        </button>
                      ) : (
                        <div className="qtd">
                          <button onClick={() => alterar(item, -1)} aria-label="Remover um">−</button>
                          <span>{n}</span>
                          <button onClick={() => alterar(item, 1)} aria-label="Adicionar um">+</button>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
              {lista.length === 0 && <p className="vazio">Nenhum item encontrado. Tente outra busca ou outro período.</p>}
            </div>
          </section>

          <section id="como" className="secao claro">
            <Revelar>
              <p className="eyebrow">Passo a passo</p>
              <h2>Como funciona</h2>
              <p className="sub">Do orçamento à entrega, tudo organizado.</p>
            </Revelar>
            <Revelar className="passos">
              {[
                ['1', 'Escolha a data', 'Informe o período da sua festa.'],
                ['2', 'Monte o orçamento', 'Adicione itens e veja o total na hora.'],
                ['3', 'Envie o pedido', 'A locadora analisa e confirma com você.'],
                ['4', 'Celebre!', 'Receba, aproveite e devolva sem estresse.'],
              ].map(([n, t, d]) => (
                <div key={n} className="passo">
                  <span className="num">{n}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              ))}
            </Revelar>
            <Revelar className="trio">
              <div className="caixa"><h3>Cliente</h3><p>Escolhe os itens, consulta a disponibilidade e reserva.</p></div>
              <div className="caixa"><h3>Locadora</h3><p>Cadastra itens e estoque, bloqueia datas e aprova pedidos.</p></div>
              <div className="caixa"><h3>Administrador</h3><p>Gerencia usuários, permissões e configurações.</p></div>
            </Revelar>
          </section>

          <section id="porque" className="secao">
            <Revelar>
              <p className="eyebrow">Vantagens</p>
              <h2>Por que a Festa Perfeita?</h2>
            </Revelar>
            <Revelar className="duo">
              <div className="caixa antes">
                <h3>Antes ✕</h3>
                <ul>
                  <li>Catálogo desatualizado</li>
                  <li>Controle manual</li>
                  <li>Dupla reserva</li>
                  <li>Orçamentos manuais</li>
                  <li>Falta de histórico</li>
                </ul>
              </div>
              <div className="caixa depois">
                <h3>Com a plataforma ✓</h3>
                <ul>
                  <li>Catálogo centralizado</li>
                  <li>Disponibilidade por data</li>
                  <li>Reservas organizadas</li>
                  <li>Controle de estoque</li>
                  <li>Acompanhamento do pedido</li>
                </ul>
              </div>
            </Revelar>
          </section>

          <section id="duvidas" className="secao claro">
            <Revelar>
              <p className="eyebrow">Perguntas frequentes</p>
              <h2>Dúvidas</h2>
            </Revelar>
            <Revelar className="faq">
              {[
                ['Como sei se um item está livre na minha data?', 'Escolha o período no catálogo. Cada item mostra quantas unidades estão disponíveis naquelas datas.'],
                ['O pedido já confirma a reserva?', 'Não. Ele fica pendente até a locadora aprovar. Depois da aprovação, as datas ficam bloqueadas para outros clientes.'],
                ['Como é calculado o valor?', 'Preço da diária × quantidade × número de dias do período escolhido.'],
                ['Posso cancelar?', 'Sim. Fale com a locadora pelo WhatsApp informando o número do pedido.'],
              ].map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </Revelar>
          </section>

          <section className="cta">
            <h2>Vamos planejar sua festa?</h2>
            <p>Fale com a gente pelo WhatsApp ou comece o orçamento agora.</p>
            <div className="hero-acoes centro">
              <a className="btn grande branco" href="#catalogo">Montar orçamento</a>
              <a className="btn grande contorno" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">Falar no WhatsApp</a>
            </div>
          </section>
        </main>
      )}

      <footer className="rodape">
        <div className="rodape-in">
          <div>
            <p className="marca-rodape"><span className="marca-script">Festa</span> PERFEITA</p>
            <p>Organizar. Reservar. Celebrar.</p>
          </div>
          <div>
            <p><strong>Contato</strong></p>
            <p><a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">WhatsApp</a> · {INSTAGRAM}</p>
          </div>
        </div>
        <small>Projeto Integrador I · Engenharia de Software · Univel</small>
      </footer>

      <a className="whats" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp">
        <svg viewBox="0 0 32 32" width="28" height="28" fill="#fff" aria-hidden><path d="M16 3C9 3 3.4 8.6 3.4 15.6c0 2.3.6 4.4 1.700 6.300L3 29l7.300-1.900a12.600 12.600 0 0 0 5.700 1.400c7 0 12.600-5.600 12.600-12.600S23 3 16 3zm0 22.800c-1.900 0-3.700-.5-5.200-1.500l-.4-.2-4.300 1.100 1.200-4.200-.3-.4a10.200 10.200 0 0 1-1.600-5.500C5.400 9.600 10.100 5 16 5s10.600 4.600 10.600 10.500S21.900 25.800 16 25.800zm5.800-7.600c-.3-.2-1.900-.9-2.200-1-.3-.1-.5-.2-.7.200l-1 1.200c-.2.200-.4.200-.7.100a8.600 8.600 0 0 1-4.300-3.800c-.3-.6.300-.6.900-1.800.1-.2 0-.4 0-.5l-1-2.300c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.100-.9.400-.3.300-1.200 1.200-1.200 2.900s1.200 3.400 1.400 3.600c.2.200 2.400 3.700 5.800 5.100 2.100.9 2.900.9 3.900.8.600-.1 1.900-.8 2.200-1.500.3-.8.300-1.400.2-1.500-.1-.2-.3-.3-.6-.5z" /></svg>
      </a>

      {toast && <div className="toast" role="status">{toast}</div>}

      {detalhe && (
        <div className="fundo centro" onClick={() => setDetalhe(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label={detalhe.nome} onClick={(e) => e.stopPropagation()}>
            <button className="fechar" onClick={() => setDetalhe(null)} aria-label="Fechar">✕</button>
            <Foto item={detalhe} grande />
            <div className="modal-corpo">
              <span className="tag fixa">{detalhe.categoria}</span>
              <h3>{detalhe.nome}</h3>
              <p>{detalhe.descricao}</p>
              <p className="preco">{brl(detalhe.preco)} <small>/ dia</small></p>
              <p className="disp"><i />{disponivel(detalhe, reservas, inicio, fim)} unidade(s) {periodoOk ? 'livres no período' : 'em estoque'}</p>
              <button
                className="btn cheio"
                disabled={disponivel(detalhe, reservas, inicio, fim) === 0}
                onClick={() => { alterar(detalhe, 1); setDetalhe(null) }}
              >
                Adicionar ao orçamento
              </button>
            </div>
          </div>
        </div>
      )}

      {sucesso && (
        <div className="fundo centro" onClick={() => setSucesso(null)}>
          <div className="modal sucesso" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ok">🎉</div>
            <h3>Pedido enviado!</h3>
            <p>
              Pedido nº <strong>{sucesso.id.slice(0, 6).toUpperCase()}</strong> · {brl(sucesso.total)}
              <br />
              A locadora vai analisar e confirmar com você. Agilize chamando no WhatsApp:
            </p>
            <a className="btn cheio" href={linkWhats(sucesso)} target="_blank" rel="noreferrer">Enviar pelo WhatsApp</a>
            <button className="link" onClick={() => setSucesso(null)}>Fechar</button>
          </div>
        </div>
      )}

      {aberto && (
        <div className="fundo" onClick={() => setAberto(false)}>
          <aside className="gaveta" onClick={(e) => e.stopPropagation()} aria-label="Orçamento">
            <div className="gaveta-topo">
              <h2>Seu orçamento</h2>
              <button className="fechar estatico" onClick={() => setAberto(false)} aria-label="Fechar">✕</button>
            </div>
            <p className="sub">
              {periodoOk ? `${qtdDias} dia(s): ${fmt(inicio)} a ${fmt(fim)}` : 'Escolha o período no catálogo para calcular o total.'}
            </p>
            {linhas.length === 0 ? (
              <p className="vazio">Nenhum item adicionado ainda.</p>
            ) : (
              <ul className="linhas">
                {linhas.map((l) => (
                  <li key={l.item.id}>
                    <span>{l.item.emoji} {l.item.nome} × {l.qtd}</span>
                    <span>{brl(l.subtotal)}</span>
                    <button className="link" onClick={() => setCarrinho((c) => ({ ...c, [l.item.id]: 0 }))}>remover</button>
                  </li>
                ))}
              </ul>
            )}
            <p className="total">Total <strong>{brl(total)}</strong></p>
            <label>Nome<input value={cliente} onChange={(e) => setCliente(e.target.value)} autoComplete="name" /></label>
            <label>WhatsApp<input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(45) 90000-0000" inputMode="tel" autoComplete="tel" /></label>
            {aviso && <p className="erro">{aviso}</p>}
            <button className="btn cheio" onClick={confirmar}>Solicitar reserva</button>
            <p className="nota">Sem compromisso: a reserva só é confirmada após a aprovação da locadora.</p>
          </aside>
        </div>
      )}
    </>
  )
}

function Painel({ reservas, onStatus }: { reservas: Reserva[]; onStatus: (id: string, s: Status) => void }) {
  const pend = reservas.filter((r) => r.status === 'pendente').length
  const apr = reservas.filter((r) => r.status === 'aprovada')
  return (
    <main className="secao">
      <p className="eyebrow">Painel</p>
      <h2>Área da locadora</h2>
      <p className="sub">
        Ao aprovar, as datas ficam bloqueadas; ao recusar, os itens voltam ao estoque. (Protótipo: sem
        login, dados salvos neste navegador.)
      </p>
      <div className="metricas">
        <div className="caixa"><span>Pendentes</span><strong>{pend}</strong></div>
        <div className="caixa"><span>Aprovados</span><strong>{apr.length}</strong></div>
        <div className="caixa"><span>Receita aprovada</span><strong>{brl(apr.reduce((s, r) => s + r.total, 0))}</strong></div>
      </div>
      <h3>Pedidos</h3>
      {reservas.length === 0 && <p className="vazio">Nenhum pedido ainda. Faça um pedido na loja para vê-lo aqui.</p>}
      <div className="pedidos">
        {reservas.map((r) => (
          <article key={r.id} className="caixa">
            <div className="linha-topo">
              <strong>{r.cliente} <small>#{r.id.slice(0, 6).toUpperCase()}</small></strong>
              <span className={`status ${r.status}`}>{r.status}</span>
            </div>
            <p>{fmt(r.inicio)} a {fmt(r.fim)} · {r.telefone} · <strong>{brl(r.total)}</strong></p>
            <ul>
              {r.itens.map((i) => (
                <li key={i.itemId}>{i.qtd}× {ITENS.find((x) => x.id === i.itemId)?.nome}</li>
              ))}
            </ul>
            {r.status === 'pendente' && (
              <div className="acoes">
                <button className="btn pequeno" onClick={() => onStatus(r.id, 'aprovada')}>Aprovar</button>
                <button className="btn pequeno sec" onClick={() => onStatus(r.id, 'recusada')}>Recusar</button>
              </div>
            )}
          </article>
        ))}
      </div>
      <h3>Estoque</h3>
      <div className="tabela-wrap">
        <table>
          <thead><tr><th>Item</th><th>Categoria</th><th>Diária</th><th>Estoque</th></tr></thead>
          <tbody>
            {ITENS.map((i) => (
              <tr key={i.id}><td>{i.emoji} {i.nome}</td><td>{i.categoria}</td><td>{brl(i.preco)}</td><td>{i.estoque}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
