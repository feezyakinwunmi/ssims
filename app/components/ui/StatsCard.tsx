'use client'

import { motion } from 'framer-motion'

interface StatsCardProps {
  title: string
  value: string | number
  icon: string
  trend?: number
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

const colorGradients = {
  blue: 'from-blue-600 to-blue-800',
  green: 'from-green-600 to-green-800',
  yellow: 'from-yellow-600 to-yellow-800',
  red: 'from-red-600 to-red-800',
  purple: 'from-purple-600 to-purple-800'
}

export default function StatsCard({ title, value, icon, trend, color = 'blue' }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${colorGradients[color]} rounded-xl p-6 text-white shadow-lg`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-90 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend !== undefined && (
            <p className={`text-xs mt-2 ${trend >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </motion.div>
  )
}