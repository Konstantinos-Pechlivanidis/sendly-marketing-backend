import { useState, useEffect } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * Pie Chart Component
 * Wrapper around Recharts PieChart with glass styling
 */
export default function PieChart({ data, dataKey = 'value', nameKey = 'name', colors = ['#99B5D7', '#C09DAE', '#6686A9', '#B3CDDA', '#7C5A67'], ...props }) {
  const [outerRadius, setOuterRadius] = useState(100);

  useEffect(() => {
    const updateRadius = () => {
      setOuterRadius(window.innerWidth >= 640 ? 100 : 80);
    };
    
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 sm:p-3 rounded-lg glass border border-neutral-border/60 backdrop-blur-[24px] shadow-glass-light">
          <p className="text-xs sm:text-sm font-medium text-neutral-text-primary mb-1">{payload[0].payload[nameKey]}</p>
          <p className="text-xs sm:text-sm text-neutral-text-secondary" style={{ color: payload[0].color }}>
            {payload[0].name || 'Value'}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
      <RechartsPieChart {...props}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey={dataKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ color: '#14161C', fontSize: '11px' }}
          iconSize={12}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

