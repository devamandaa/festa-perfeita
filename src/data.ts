// Troque pelo WhatsApp real da loja (DDI + DDD + número, só dígitos).
export const WHATSAPP = '5545900000000'
export const INSTAGRAM = '@festaperfeita'

// ---- Configurações da loja (troque pelos dados reais) ----
// Senha da Área da locadora. Atenção: é só uma barreira no navegador, não é segurança real.
export const SENHA_PAINEL = 'festa2026'
// Chave Pix da loja, mostrada ao cliente depois do pedido.
export const PIX_CHAVE = 'sua-chave-pix-aqui'
// Percentual do total pedido como sinal para garantir a reserva.
export const SINAL_PERCENTUAL = 30
// Taxas de entrega por região (valores de exemplo: ajuste para os da loja).
export const REGIOES: { nome: string; taxa: number }[] = [
  { nome: 'Centro', taxa: 20 },
  { nome: 'Bairros próximos', taxa: 35 },
  { nome: 'Outras regiões', taxa: 60 },
]

export type Categoria = 'Decoração' | 'Móveis' | 'Itens de Festa'

export interface Item {
  id: string
  nome: string
  categoria: Categoria
  emoji: string
  preco: number // valor em R$ (por dia ou por locação, conforme `cobranca`)
  cobranca?: Cobranca // padrão: 'dia'
  foto?: string // foto enviada pelo painel (data URL); sem ela usa public/fotos/<id>.jpg
  estoque: number
  descricao: string
}

export type Cobranca = 'dia' | 'locacao'
export type Status = 'pendente' | 'aprovada' | 'recusada'

export interface Entrega {
  tipo: 'retirada' | 'entrega'
  regiao?: string
  endereco?: string
  taxa: number
}

export interface Bloqueio {
  id: string
  inicio: string
  fim: string
  motivo: string
}

export interface Reserva {
  id: string
  itens: { itemId: string; qtd: number }[]
  inicio: string // yyyy-mm-dd
  fim: string
  cliente: string
  telefone: string
  status: Status
  total: number
  pagamento?: string
  entrega?: Entrega
}

// Itens de exemplo: troque pelos itens reais da locadora.
export const ITENS: Item[] = [
  { id: 'arco', nome: 'Arco de balões', categoria: 'Decoração', emoji: '🎈', preco: 360, estoque: 3, descricao: 'Arco de 2,20 m, até 3 cores.' },
  { id: 'painel', nome: 'Painel redondo', categoria: 'Decoração', emoji: '🌸', preco: 150, estoque: 4, descricao: 'Estrutura de ferro branca de 1,5 m.' },
  { id: 'flores', nome: 'Kit flores artificiais', categoria: 'Decoração', emoji: '💐', preco: 80, estoque: 6, descricao: 'Dois arranjos para mesa e painel.' },
  { id: 'neon', nome: 'Letreiro luminoso', categoria: 'Decoração', emoji: '✨', preco: 180, estoque: 2, descricao: 'Letreiro LED "Happy Birthday".' },
  { id: 'mesa', nome: 'Mesa de bolo', categoria: 'Móveis', emoji: '🎂', preco: 80, estoque: 5, descricao: 'Mesa provençal branca. Toalha à parte.' },
  { id: 'sofa', nome: 'Sofá de festa', categoria: 'Móveis', emoji: '🛋️', preco: 430, estoque: 2, descricao: 'Sofá 3 lugares para o espaço lounge.' },
  { id: 'puff', nome: 'Puffs coloridos', categoria: 'Móveis', emoji: '🟣', preco: 30, estoque: 12, descricao: 'Puff de 40 × 40 cm. Preço por unidade.' },
  { id: 'cadeira', nome: 'Cadeira de acrílico', categoria: 'Móveis', emoji: '🪑', preco: 50, estoque: 60, descricao: 'Preço por unidade.' },
  { id: 'louca', nome: 'Jogo de pratos e talheres', categoria: 'Itens de Festa', emoji: '🍽️', preco: 50, estoque: 10, descricao: 'Serve 10 pessoas.' },
  { id: 'taca', nome: 'Taças e copos', categoria: 'Itens de Festa', emoji: '🥂', preco: 48, estoque: 10, descricao: 'Kit com 12 peças.' },
  { id: 'cascata', nome: 'Torre de doces', categoria: 'Itens de Festa', emoji: '🧁', cobranca: 'locacao', preco: 48, estoque: 4, descricao: 'Suporte de madeira ou metal para doces.' },
  { id: 'pipoca', nome: 'Carrinho de pipoca', categoria: 'Itens de Festa', emoji: '🍿', preco: 530, estoque: 2, descricao: 'Máquina e carrinho decorado.' },
]

export function dias(inicio: string, fim: string): number {
  const d = (new Date(fim).getTime() - new Date(inicio).getTime()) / 86400000
  return Math.max(1, Math.round(d) + 1)
}

export function sobrepoe(a1: string, a2: string, b1: string, b2: string): boolean {
  return a1 <= b2 && b1 <= a2
}

/** Unidades livres de um item no período (ignora reservas recusadas). */
export function disponivel(item: Item, reservas: Reserva[], inicio: string, fim: string): number {
  if (!inicio || !fim || fim < inicio) return item.estoque
  const usado = reservas
    .filter((r) => r.status !== 'recusada' && sobrepoe(r.inicio, r.fim, inicio, fim))
    .flatMap((r) => r.itens)
    .filter((i) => i.itemId === item.id)
    .reduce((s, i) => s + i.qtd, 0)
  return Math.max(0, item.estoque - usado)
}

export const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Texto ao lado do preço: "/ dia" ou "/ locação". */
export const rotuloCobranca = (item: Item) => (item.cobranca === 'locacao' ? '/ locação' : '/ dia')

/** Subtotal de um item: por dia multiplica pelos dias; por locação é valor único. */
export const subtotal = (item: Item, qtd: number, qtdDias: number) =>
  item.preco * qtd * (item.cobranca === 'locacao' ? 1 : qtdDias)

/** Bloqueio da locadora que cruza o período escolhido (ou undefined). */
export function bloqueioNoPeriodo(bloqueios: Bloqueio[], inicio: string, fim: string) {
  if (!inicio || !fim || fim < inicio) return undefined
  return bloqueios.find((b) => sobrepoe(b.inicio, b.fim, inicio, fim))
}

export const idCurto = (id: string) => id.slice(0, 6).toUpperCase()
