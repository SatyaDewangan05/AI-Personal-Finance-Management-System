"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { withAuth } from "@/components/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";

function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/goals");
      setGoals(response.data);
      setError(null);
    } catch (err) {
      setError("Error loading goals");
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/goals", newGoal);
      setNewGoal({
        name: "",
        targetAmount: "",
        currentAmount: "",
        deadline: "",
      });
      fetchGoals();
    } catch (err) {
      setError("Error adding goal");
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
    return <div>{error}</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Financial Goals</h2>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="name"
              placeholder="Goal Name"
              value={newGoal.name}
              onChange={handleInputChange}
              required
            />
            <Input
              name="targetAmount"
              type="number"
              step="0.01"
              placeholder="Target Amount"
              value={newGoal.targetAmount}
              onChange={handleInputChange}
              required
            />
            <Input
              name="currentAmount"
              type="number"
              step="0.01"
              placeholder="Current Amount"
              value={newGoal.currentAmount}
              onChange={handleInputChange}
              required
            />
            <Input
              name="deadline"
              type="date"
              value={newGoal.deadline}
              onChange={handleInputChange}
              required
            />
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" /> Add Goal
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.length === 0 ? (
          <p>No goals set yet. Add your first goal above.</p>
        ) : (
          goals.map((goal) => (
            <Card key={goal._id}>
              <CardHeader>
                <CardTitle>{goal.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold mb-2">
                  ${goal.currentAmount} / ${goal.targetAmount}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{
                      width: `${
                        goal.currentAmount / goal.targetAmount > 1
                          ? 100
                          : (goal.currentAmount / goal.targetAmount) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">
                  Deadline: {new Date(goal.deadline).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default withAuth(GoalsPage);
