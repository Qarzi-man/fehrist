const GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-400 to-amber-500',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-pink-600',
]

export function avatarGradient(name: string): string {
  return GRADIENTS[name.charCodeAt(0) % GRADIENTS.length]
}
