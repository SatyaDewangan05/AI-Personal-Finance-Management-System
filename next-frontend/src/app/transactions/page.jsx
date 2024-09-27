"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { withAuth } from "@/components/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    category: "",
    otherCategory: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/transactions", {
        params: { start_date: startDate, end_date: endDate },
      });
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      setError("Error loading transactions");
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value) => {
    setNewTransaction((prev) => ({
      ...prev,
      category: value,
      otherCategory: value === "other" ? prev.otherCategory : "",
    }));
  };

  const handleTypeChange = (value) => {
    setNewTransaction((prev) => ({ ...prev, type: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const transactionToSubmit = {
        ...newTransaction,
        category:
          newTransaction.category === "other"
            ? newTransaction.otherCategory
            : newTransaction.category,
      };
      await axios.post("/api/transactions", transactionToSubmit);
      setNewTransaction({
        description: "",
        amount: "",
        category: "",
        otherCategory: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchTransactions();
    } catch (err) {
      setError("Error adding transaction");
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get("/api/transactions/export", {
        params: { start_date: startDate, end_date: endDate },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "transactions.csv");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      setError("Error exporting transactions");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Transactions</h2>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="description"
              placeholder="Description"
              value={newTransaction.description}
              onChange={handleInputChange}
              required
            />
            <Input
              name="amount"
              type="number"
              step="0.01"
              placeholder="Amount"
              value={newTransaction.amount}
              onChange={handleInputChange}
              required
            />
            <Select
              value={newTransaction.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groceries">Groceries</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {newTransaction.category === "other" && (
              <Input
                name="otherCategory"
                placeholder="Specify other category"
                value={newTransaction.otherCategory}
                onChange={handleInputChange}
                required
              />
            )}

            <Input
              name="date"
              type="date"
              value={newTransaction.date}
              onChange={handleInputChange}
              required
            />
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
          {transactions.length === 0 ? (
            <p>No transactions found for the selected date range.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>
                      {new Date(transaction.time).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        transaction.amount >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(TransactionsPage);
