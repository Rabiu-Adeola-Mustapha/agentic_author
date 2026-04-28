'use client';

import { useState } from 'react';
import { Download, Lock, FileText, FileDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface ExportMenuProps {
  projectId: string;
  userPlan: string;
}

export function ExportMenu({ projectId, userPlan }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (userPlan === 'free') {
      setShowUpgradeModal(true);
      return;
    }

    setIsExporting(format);
    toast({ title: 'Preparing your download...' });

    try {
      const res = await fetch(`/api/export/${projectId}?format=${format}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'Download complete' });
    } catch (error) {
      console.error(error);
      toast({ 
        title: 'Export Failed', 
        description: 'There was an error generating your file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-100">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-zinc-950 border-zinc-800">
          <DropdownMenuItem 
            onClick={() => handleExport('pdf')}
            disabled={!!isExporting}
            className="flex items-center justify-between cursor-pointer focus:bg-zinc-800 focus:text-zinc-100"
          >
            <div className="flex items-center">
              {isExporting === 'pdf' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-zinc-400" />
              ) : (
                <FileText className="mr-2 h-4 w-4 text-zinc-400" />
              )}
              Download PDF
            </div>
            {userPlan === 'free' && <Lock className="h-3 w-3 text-zinc-500" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleExport('docx')}
            disabled={!!isExporting}
            className="flex items-center justify-between cursor-pointer focus:bg-zinc-800 focus:text-zinc-100"
          >
            <div className="flex items-center">
              {isExporting === 'docx' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-zinc-400" />
              ) : (
                <FileDown className="mr-2 h-4 w-4 text-zinc-400" />
              )}
              Download DOCX
            </div>
            {userPlan === 'free' && <Lock className="h-3 w-3 text-zinc-500" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-400" />
              Export is a Pro feature
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Upgrade to the Pro plan to download your generated content as PDF and DOCX files.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="rounded-lg bg-indigo-500/10 p-4 border border-indigo-500/20">
              <h4 className="font-semibold text-indigo-200 mb-2">Pro Plan Includes:</h4>
              <ul className="text-sm text-zinc-300 space-y-2">
                <li className="flex items-center gap-2">✓ Unlimited AI Generations</li>
                <li className="flex items-center gap-2">✓ PDF & DOCX Exports</li>
                <li className="flex items-center gap-2">✓ Advanced Prompt Refinement</li>
                <li className="flex items-center gap-2">✓ Priority Support</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Cancel
            </Button>
            <Link href="/dashboard/billing">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Upgrade to Pro
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
