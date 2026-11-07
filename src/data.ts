// Troque pelo WhatsApp real da loja (DDI + DDD + número, só dígitos).
export const WHATSAPP = '5545900000000'
export const INSTAGRAM = '@festaperfeita'

export type Categoria = 'Decoração' | 'Móveis' | 'Itens de Festa'

export interface Item {
  id: string
  nome: string
  categoria: Categoria
  emoji: string
  preco: number // diária em R$
  estoque: number
  descricao: string
}

export type Status = 'pendente' | 'aprovada' | 'recusada'

export interface Reserva {
  id: string
  itens: { itemId: string; qtd: number }[]
  inicio: string // yyyy-mm-dd
  fim: string
  cliente: string
  telefone: string
  status: Status
  total: number
}

// Itens de exemplo: troque pelos itens reais da locadora.
export const ITENS: Item[] = [
  { id: 'arco', nome: 'Arco de balões', categoria: 'Decoração', emoji: '🎈', preco: 120, estoque: 3, descricao: 'Arco orgânico nas cores da sua festa.' },
  { id: 'painel', nome: 'Painel redondo', categoria: 'Decoração', emoji: '🌸', preco: 80, estoque: 4, descricao: 'Painel de 1,5 m com tema à escolha.' },
  { id: 'flores', nome: 'Kit flores artificiais', categoria: 'Decoração', emoji: '💐', preco: 60, estoque: 6, descricao: 'Arranjos para mesa e painel.' },
  { id: 'neon', nome: 'Letreiro luminoso', categoria: 'Decoração', emoji: '✨', preco: 90, estoque: 2, descricao: 'Frase "Feliz Aniversário" em LED.' },
  { id: 'mesa', nome: 'Mesa de bolo', categoria: 'Móveis', emoji: '🎂', preco: 70, estoque: 5, descricao: 'Mesa provençal com toalha.' },
  { id: 'sofa', nome: 'Sofá de festa', categoria: 'Móveis', emoji: '🛋️', preco: 150, estoque: 2, descricao: 'Sofá 3 lugares para o espaço lounge.' },
  { id: 'puff', nome: 'Puffs coloridos', categoria: 'Móveis', emoji: '🟣', preco: 25, estoque: 12, descricao: 'Preço por unidade.' },
  { id: 'cadeira', nome: 'Cadeira de acrílico', categoria: 'Móveis', emoji: '🪑', preco: 8, estoque: 60, descricao: 'Preço por unidade.' },
  { id: 'louca', nome: 'Jogo de pratos e talheres', categoria: 'Itens de Festa', emoji: '🍽️', preco: 35, estoque: 10, descricao: 'Serve 10 pessoas.' },
  { id: 'taca', nome: 'Taças e copos', categoria: 'Itens de Festa', emoji: '🥂', preco: 20, estoque: 10, descricao: 'Kit com 12 peças.' },
  { id: 'cascata', nome: 'Torre de doces', categoria: 'Itens de Festa', emoji: '🧁', preco: 45, estoque: 4, descricao: 'Suporte em 3 andares para doces.' },
  { id: 'pipoca', nome: 'Carrinho de pipoca', categoria: 'Itens de Festa', emoji: '🍿', preco: 100, estoque: 2, descricao: 'Máquina e carrinho decorado.' },
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
