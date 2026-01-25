'use client'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartData, ChartOptions } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DoughnutChartProps {
  data?: ChartData<'doughnut'>
  options?: ChartOptions<'doughnut'>
  analytics : any
}


export default function DoughnutChart({  options, analytics }: DoughnutChartProps) {

  const isEmpty = false

  const defaultData: ChartData<'doughnut'> = {
    datasets: [
      {
        data: [analytics.ticketsVIP, analytics.ticketPremiumVip, analytics.ticketsGeneral ?? 100],
        backgroundColor: [
          '#FF8A9F', // VIP
          '#E752AE', // Premium VIP
          '#FFEFE2', // General
        ],
        borderWidth: 0,
        spacing: 0,
        hoverOffset: 0,
      },
    ],
  }

  const emptyData: ChartData<'doughnut'> = {
    datasets: [
      {
        data: [1], // Une seule valeur pour faire un cercle complet
        backgroundColor: ['#E0E0E0'], // Gris
        borderWidth: 0,
        spacing: 0,
        hoverOffset: 0,
      },
    ],
  }

  const defaultOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '85%',
    layout: {
      padding: 0,
    },
  }

  return <Doughnut data={isEmpty ? emptyData : defaultData} options={options || defaultOptions} />
}
