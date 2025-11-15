import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * Bar Chart Component
 * Wrapper around Recharts BarChart with glass styling
 */
export default function BarChart({ data, dataKey, name, fill = '#99B5D7', ...props }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-lg glass border border-glass-border backdrop-blur-[24px]">
          <p className="text-sm font-medium text-primary-light mb-1">{payload[0].payload.name || name}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} {...props}>
        <CartesianGrid strokeDasharray="3 3" stroke="#94A9B4" opacity={0.3} />
        <XAxis 
          dataKey="name" 
          stroke="#94A9B4"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#94A9B4"
          style={{ fontSize: '12px' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ color: '#E5E5E5', fontSize: '12px' }}
        />
        <Bar 
          dataKey={dataKey} 
          fill={fill}
          radius={[8, 8, 0, 0]}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

