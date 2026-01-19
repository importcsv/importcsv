"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Database,
  Loader2,
} from "lucide-react";
import { integrationsApi, Integration } from "@/utils/apiClient";
import { IntegrationForm } from "@/components/IntegrationForm";

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIntegration, setDeletingIntegration] = useState<Integration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await integrationsApi.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
      setError("Failed to load integrations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingIntegration(null);
    setFormOpen(true);
  };

  const handleEdit = (integration: Integration) => {
    setEditingIntegration(integration);
    setFormOpen(true);
  };

  const handleDeleteClick = (integration: Integration) => {
    setDeletingIntegration(integration);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingIntegration) return;

    setIsDeleting(true);
    try {
      await integrationsApi.deleteIntegration(deletingIntegration.id);
      setIntegrations((prev) =>
        prev.filter((i) => i.id !== deletingIntegration.id)
      );
      setDeleteDialogOpen(false);
      setDeletingIntegration(null);
    } catch (err) {
      console.error("Failed to delete integration:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSuccess = (integration: Integration) => {
    if (editingIntegration) {
      // Update existing
      setIntegrations((prev) =>
        prev.map((i) => (i.id === integration.id ? integration : i))
      );
    } else {
      // Add new
      setIntegrations((prev) => [...prev, integration]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "supabase":
        return <Database className="w-4 h-4 text-green-600" />;
      default:
        return <Database className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "supabase":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Supabase
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/settings"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Settings
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-gray-500 mt-1">
            Connect to external services to automatically deliver imported data
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center text-red-600">{error}</div>
        </Card>
      ) : integrations.length === 0 ? (
        <Card className="p-12 text-center">
          <Database className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">No integrations yet</h3>
          <p className="text-gray-500 mt-1 mb-4">
            Add a database integration to automatically send imported data to your database.
          </p>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Integration
          </Button>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integrations.map((integration) => (
                <TableRow key={integration.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(integration.type)}
                      <span className="font-medium">{integration.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(integration.type)}</TableCell>
                  <TableCell className="text-gray-500">
                    {formatDate(integration.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(integration)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(integration)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Form dialog */}
      <IntegrationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
        editingIntegration={editingIntegration}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingIntegration?.name}&quot;?
              This will also remove any importer destinations using this integration.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
