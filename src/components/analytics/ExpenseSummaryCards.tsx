import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Receipt, TrendingUp, Calendar } from "lucide-react";

interface ExpenseData {
  month_year: string;
  category: string;
  total_amount: number;
  transaction_count: number;
}

interface ExpenseSummaryCardsProps {
  data: ExpenseData[];
}

const ExpenseSummaryCards: React.FC<ExpenseSummaryCardsProps> = ({ data }) => {
  const totalSpent = data.reduce((sum, item) => sum + Number(item.total_amount), 0);
  const totalTransactions = data.reduce((sum, item) => sum + item.transaction_count, 0);
  const uniqueCategories = new Set(data.map(item => item.category)).size;
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthData = data.filter(item => item.month_year === currentMonth);
  const currentMonthSpent = currentMonthData.reduce((sum, item) => sum + Number(item.total_amount), 0);

  const summaryData = [
    {
      title: "Total Spent",
      value: `$${totalSpent.toFixed(2)}`,
      icon: DollarSign,
      description: "All time spending"
    },
    {
      title: "Total Receipts",
      value: totalTransactions.toString(),
      icon: Receipt,
      description: "Processed receipts"
    },
    {
      title: "Categories",
      value: uniqueCategories.toString(),
      icon: TrendingUp,
      description: "Expense categories"
    },
    {
      title: "This Month",
      value: `$${currentMonthSpent.toFixed(2)}`,
      icon: Calendar,
      description: "Current month spending"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryData.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ExpenseSummaryCards;