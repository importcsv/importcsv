"use client";

import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  // Auth is handled by the layout

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

      <Card className="p-12 text-center">
        <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">Settings coming soon</h3>
        <p className="text-gray-500 mt-1">
          Account and preferences management will be available here.
        </p>
      </Card>
    </div>
  );
}
