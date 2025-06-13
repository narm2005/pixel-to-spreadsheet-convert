import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ExpenseData {
  month_year: string;
  category: string;
  total_amount: number;
  transaction_count: number;
}

interface ExpenseChartProps {
  data: ExpenseData[];
  type: 'monthly' | 'category';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ExpenseChart: React.FC<ExpenseChartProps> = ({ data, type }) => {
  if (type === 'monthly') {
    // Group by month for monthly trend
    const monthlyData = data.reduce((acc, item) => {
      const existing = acc.find(month => month.month_year === item.month_year);
      if (existing) {
        existing.total_amount += Number(item.total_amount);
        existing.transaction_count += item.transaction_count;
      } else {
        acc.push({
          month_year: item.month_year,
          total_amount: Number(item.total_amount),
          transaction_count: item.transaction_count
        });
      }
      return acc;
    }, [] as any[]).sort((a, b) => a.month_year.localeCompare(b.month_year));

    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
          <CardDescription>Your spending over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month_year" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
              <Legend />
              <Bar dataKey="total_amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  // Group by category for pie chart
  const categoryData = data.reduce((acc, item) => {
    const existing = acc.find(cat => cat.category === item.category);
    if (existing) {
      existing.total_amount += Number(item.total_amount);
      existing.transaction_count += item.transaction_count;
    } else {
      acc.push({
        category: item.category,
        total_amount: Number(item.total_amount),
        transaction_count: item.transaction_count
      });
    }
    return acc;
  }, [] as any[]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Breakdown of expenses by category</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="total_amount"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ExpenseChart;