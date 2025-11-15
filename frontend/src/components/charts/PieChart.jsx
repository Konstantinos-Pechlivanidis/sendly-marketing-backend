import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * Pie Chart Component
 * Wrapper around Recharts PieChart with glass styling
 */
export default function PieChart({ data, dataKey = 'value', nameKey = 'name', colors = ['#99B5D7', '#C09DAE', '#6686A9', '#B3CDDA', '#7C5A67'], ...props }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-lg glass border border-glass-border backdrop-blur-[24px]">
          <p className="text-sm font-medium text-primary-light mb-1">{payload[0].payload[nameKey]}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            {payload[0].name || 'Value'}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart {...props}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey={dataKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ color: '#E5E5E5', fontSize: '12px' }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

