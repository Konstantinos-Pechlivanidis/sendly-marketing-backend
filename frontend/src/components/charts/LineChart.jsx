import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * Line Chart Component
 * Wrapper around Recharts LineChart with glass styling
 */
export default function LineChart({ data, dataKey, name, stroke = '#99B5D7', ...props }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 sm:p-3 rounded-lg glass border border-neutral-border/60 backdrop-blur-[24px] shadow-glass-light">
          <p className="text-xs sm:text-sm font-medium text-neutral-text-primary mb-1">{payload[0].payload.name || name}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs sm:text-sm text-neutral-text-secondary" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
      <RechartsLineChart data={data} {...props}>
        <CartesianGrid strokeDasharray="3 3" stroke="#94A9B4" opacity={0.3} />
        <XAxis 
          dataKey="name" 
          stroke="#94A9B4"
          style={{ fontSize: '11px' }}
          tick={{ fontSize: '11px' }}
        />
        <YAxis 
          stroke="#94A9B4"
          style={{ fontSize: '11px' }}
          tick={{ fontSize: '11px' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ color: '#14161C', fontSize: '11px' }}
          iconSize={12}
        />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={stroke}
          strokeWidth={2}
          dot={{ fill: stroke, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

