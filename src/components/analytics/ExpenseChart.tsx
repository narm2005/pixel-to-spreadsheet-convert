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
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Analytics Available</CardTitle>
          <CardDescription>
            Process receipts to unlock insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          Analytics will appear here once data is available.
        </CardContent>
      </Card>
    );
  }

  if (type === 'monthly') {
    const monthlyData = data.reduce((acc, item) => {
      const existing = acc.find(m => m.month_year === item.month_year);
      if (existing) {
        existing.total_amount += Number(item.total_amount);
        existing.transaction_count += item.transaction_count;
      } else {
        acc.push({
          month_year: item.month_year,
          total_amount: Number(item.total_amount),
          transaction_count: item.transaction_count,
        });
      }
      return acc;
    }, [] as any[]);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month_year" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_amount" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  const categoryData = data.reduce((acc, item) => {
    const existing = acc.find(c => c.category === item.category);
    if (existing) {
      existing.total_amount += Number(item.total_amount);
    } else {
      acc.push({
        category: item.category,
        total_amount: Number(item.total_amount),
      });
    }
    return acc;
  }, [] as any[]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="total_amount"
              cx="50%"
              cy="50%"
            >
              {categoryData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};


export default ExpenseChart;
