"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { withAuth } from "@/components/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, Edit2, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBudget, setNewBudget] = useState({
    category: "",
    amount: "",
    period: "monthly",
  });
  const [editingBudget, setEditingBudget] = useState(null);
  const [addBudgetError, setAddBudgetError] = useState(null);
  const [updateBudgetError, setUpdateBudgetError] = useState(null);
  const [deleteBudgetError, setDeleteBudgetError] = useState(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/budgets");
      setBudgets(response.data);
      setError(null);
    } catch (err) {
      setError("Error loading budgets");
      setBudgets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e, isEditing = false) => {
    const { name, value } = e.target;
    if (isEditing) {
      setEditingBudget((prev) => ({ ...prev, [name]: value }));
    } else {
      setNewBudget((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryChange = (value) => {
    setNewBudget((prev) => ({ ...prev, category: value }));
  };

  const handlePeriodChange = (value, isEditing = false) => {
    if (isEditing) {
      setEditingBudget((prev) => ({ ...prev, period: value }));
    } else {
      setNewBudget((prev) => ({ ...prev, period: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAddBudgetError(null);
    try {
      await axios.post("/api/budgets", newBudget);
      setNewBudget({
        category: "",
        amount: "",
        period: "monthly",
      });
      fetchBudgets();
    } catch (err) {
      setAddBudgetError(
        "Error adding budget. This category might already exist."
      );
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setUpdateBudgetError(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateBudgetError(null);
    try {
      await axios.put(`/api/budgets/${editingBudget._id}`, {
        amount: editingBudget.amount,
        period: editingBudget.period,
      });
      setEditingBudget(null);
      fetchBudgets();
    } catch (err) {
      setUpdateBudgetError("Error updating budget");
    }
  };

  const handleDelete = async (budgetId) => {
    setDeleteBudgetError(null);
    try {
      await axios.delete(`/api/budgets/${budgetId}`);
      fetchBudgets();
    } catch (err) {
      setDeleteBudgetError("Error deleting budget");
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
      <h2 className="text-2xl font-bold mb-6">Budgets</h2>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              value={newBudget.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groceries">Groceries</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input
              name="amount"
              type="number"
              step="0.01"
              placeholder="Budget Amount"
              value={newBudget.amount}
              onChange={handleInputChange}
              required
            />
            <Select
              value={newBudget.period}
              onValueChange={(value) => handlePeriodChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" /> Add Budget
            </Button>
          </form>
          {addBudgetError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{addBudgetError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.length === 0 ? (
          <p>No budgets set yet. Add your first budget above.</p>
        ) : (
          budgets.map((budget) => (
            <Card key={budget._id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {budget.category}
                  {budget.spent > budget.amount && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold mb-2">
                  ${budget.spent.toFixed(2)} / $
                  {parseFloat(budget.amount).toFixed(2)}
                </p>
                <Progress
                  value={(budget.spent / parseFloat(budget.amount)) * 100}
                  className="h-2 mb-2"
                />
                <p className="text-sm text-gray-500 mb-2">
                  Period: {budget.period}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Created: {new Date(budget.createdAt).toLocaleDateString()}
                </p>
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(budget)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" /> Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Edit Budget: {budget.category}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <Input
                          name="amount"
                          type="number"
                          step="0.01"
                          placeholder="Budget Amount"
                          value={editingBudget?.amount || ""}
                          onChange={(e) => handleInputChange(e, true)}
                          required
                        />
                        <Select
                          value={editingBudget?.period || ""}
                          onValueChange={(value) =>
                            handlePeriodChange(value, true)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="submit">Update Budget</Button>
                      </form>
                      {updateBudgetError && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            {updateBudgetError}
                          </AlertDescription>
                        </Alert>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(budget._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {deleteBudgetError && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{deleteBudgetError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default withAuth(BudgetsPage);
