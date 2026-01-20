'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ExternalLink,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { useToast } from '@/components/ui/use-toast';
import type { SaveStatus } from '@/hooks/useAutoSave';

interface ImporterDetailHeaderProps {
  name: string;
  importerId: string;
  saveStatus: SaveStatus;
  saveError: string | null;
  onRetry: () => void;
  onDelete: () => Promise<void>;
}

export function ImporterDetailHeader({
  name,
  importerId,
  saveStatus,
  saveError,
  onRetry,
  onDelete,
}: ImporterDetailHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      router.push('/importers');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Could not delete importer',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        href="/importers"
        className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Importers
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{name}</h1>

        <div className="flex items-center gap-3">
          <SaveStatusIndicator
            status={saveStatus}
            error={saveError}
            onRetry={onRetry}
          />

          <Button
            variant="outline"
            href={`/importers/${importerId}/preview`}
            loadingText="Loading preview..."
          >
            Preview
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Importer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this importer?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  the importer and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
