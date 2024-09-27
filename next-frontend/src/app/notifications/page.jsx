"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { withAuth } from "@/components/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Bell } from "lucide-react";

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/notifications");
      setNotifications(response.data);
      setError(null);
    } catch (err) {
      setError("Error loading notifications");
      setNotifications([]);
    } finally {
      setIsLoading(false);
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
      <h2 className="text-2xl font-bold mb-6">Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications.</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification._id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  {notification.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{notification.message}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default withAuth(NotificationsPage);
