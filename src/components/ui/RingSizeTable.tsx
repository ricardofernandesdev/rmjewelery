import React from 'react'

const sizes = [
  { diameter: '17mm', size: '17' },
  { diameter: '18mm', size: '18' },
  { diameter: '19mm', size: '19' },
  { diameter: '20mm', size: '20' },
  { diameter: '21mm', size: '21' },
  { diameter: '22mm', size: '22' },
  { diameter: '23mm', size: '23' },
]

export const RingSizeTable: React.FC = () => {
  return (
    <table className="w-full max-w-xl mx-auto my-10">
      <thead>
        <tr>
          <th className="text-left text-brand-dark font-semibold text-base pb-4 px-4">
            Diâmetro (mm)
          </th>
          <th className="text-center text-brand-dark font-semibold text-base pb-4 px-4">
            Medida
          </th>
        </tr>
      </thead>
      <tbody>
        {sizes.map((row) => (
          <tr key={row.diameter} className="border-t border-gray-200">
            <td className="py-4 px-4 text-sm text-brand-gray text-center">{row.diameter}</td>
            <td className="py-4 px-4 text-sm text-brand-dark font-medium text-center">{row.size}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
