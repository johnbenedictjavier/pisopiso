import {
  BookOpen,
  BriefcaseBusiness,
  Car,
  CircleHelp,
  Gift,
  Heart,
  HeartPulse,
  House,
  Laptop,
  MoreHorizontal,
  PlusCircle,
  Receipt,
  Repeat2,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Utensils,
} from 'lucide-react'

const icons = {
  book: BookOpen,
  'briefcase-business': BriefcaseBusiness,
  car: Car,
  gift: Gift,
  heart: Heart,
  'heart-pulse': HeartPulse,
  house: House,
  laptop: Laptop,
  'more-horizontal': MoreHorizontal,
  'plus-circle': PlusCircle,
  receipt: Receipt,
  repeat: Repeat2,
  'shopping-bag': ShoppingBag,
  sparkles: Sparkles,
  store: Store,
  'trending-up': TrendingUp,
  utensils: Utensils,
} as const

interface CategoryIconProps {
  name?: string
  size?: number
}

export default function CategoryIcon({ name, size = 17 }: CategoryIconProps) {
  const Icon = icons[name as keyof typeof icons] ?? CircleHelp
  return <Icon size={size} strokeWidth={1.8} />
}
