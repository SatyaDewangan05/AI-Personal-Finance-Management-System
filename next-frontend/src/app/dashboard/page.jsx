"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { withAuth } from "@/components/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("month");
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/dashboard?timeRange=${timeRange}`);
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError("Error loading dashboard data");
      setDashboardData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
  };

  const handleAnalyzeTransactions = async () => {
    setIsAnalyzing(true);
    try {
      const response = await axios.get("/api/analyze-transactions");
      setAnalysis(response.data.analysis);
    } catch (err) {
      console.log("error: ", err);
      setError("Error analyzing transactions");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex space-x-4">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAnalyzeTransactions} disabled={isAnalyzing}>
            {isAnalyzing ? "Analyzing..." : "Analyze Transactions"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${dashboardData.totalBalance.toFixed(2)}
            </p>
            <div className="flex items-center mt-2">
              {dashboardData.balanceChange >= 0 ? (
                <TrendingUp className="text-green-500 mr-2" />
              ) : (
                <TrendingDown className="text-red-500 mr-2" />
              )}
              <span
                className={
                  dashboardData.balanceChange >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                ${Math.abs(dashboardData.balanceChange).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${dashboardData.income.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              ${dashboardData.expenses.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.incomeVsExpenses}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.spendingByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {dashboardData.spendingByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {analysis && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transaction Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{analysis}</p>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Insights</h3>
        {dashboardData.insights.map((insight, index) => (
          <Alert
            key={index}
            variant={insight.type === "warning" ? "destructive" : "default"}
          >
            <AlertTitle className="flex items-center">
              {insight.type === "warning" ? (
                <AlertTriangle className="h-4 w-4 mr-2" />
              ) : (
                <Info className="h-4 w-4 mr-2" />
              )}
              {insight.type === "warning" ? "Warning" : "Info"}
            </AlertTitle>
            <AlertDescription>{insight.message}</AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
}

export default withAuth(DashboardPage);
