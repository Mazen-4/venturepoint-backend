import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminAnalyticsChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(result => {
        // Transform GA4 API response to chart data
        if (result && result.rows) {
          const chartData = result.rows.map(row => ({
            date: row.dimensionValues[0].value,
            sessions: parseInt(row.metricValues[0].value, 10)
          }));
          setData(chartData);
        } else {
          setData([]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch analytics data');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <h2>Website Sessions (Last 7 Days)</h2>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>Error: {error}</div>}
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="sessions" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ color: '#888', marginBottom: 8 }}>No activity data available.</div>
      )}
    </div>
  );

  return (
    <div style={{ width: '100%', height: 300 }}>
      <h2>Website Sessions (Last 7 Days)</h2>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="sessions" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AdminAnalyticsChart;
