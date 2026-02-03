"use client";

import { useEffect, useState } from "react";
import type { Config } from "@/app/types/calendar";
import {
  loadConfigTemplates,
  saveConfigTemplate,
  deleteConfigTemplate,
  type ConfigTemplate,
} from "@/lib/config-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FolderOpen, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ConfigTemplatePickerProps {
  config: Config;
  onLoad: (config: Config) => void;
  disabled?: boolean;
}

export function ConfigTemplatePicker({ config, onLoad, disabled }: ConfigTemplatePickerProps) {
  const [templates, setTemplates] = useState<ConfigTemplate[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    setTemplates(loadConfigTemplates());
  }, []);

  const refreshTemplates = () => setTemplates(loadConfigTemplates());

  const handleSave = () => {
    const name = templateName.trim() || "Untitled";
    saveConfigTemplate(name, config);
    setTemplateName("");
    setSaveOpen(false);
    refreshTemplates();
    toast.success(`Saved as "${name}"`);
  };

  const handleLoad = (t: ConfigTemplate) => {
    onLoad(t.config);
    toast.success(`Loaded "${t.name}"`);
  };

  const handleDelete = (e: React.MouseEvent, t: ConfigTemplate) => {
    e.stopPropagation();
    deleteConfigTemplate(t.id);
    refreshTemplates();
    toast.success("Template removed");
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSaveOpen(true)}
          disabled={disabled}
          className="min-h-[44px] touch-manipulation"
        >
          <Save className="size-4 shrink-0" />
          Save as template
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || templates.length === 0}
              className="min-h-[44px] touch-manipulation"
            >
              <FolderOpen className="size-4 shrink-0" />
              Load template
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[280px] overflow-y-auto min-w-[220px]">
            {templates.length === 0 ? (
              <DropdownMenuItem disabled>No templates saved</DropdownMenuItem>
            ) : (
              templates.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onSelect={() => handleLoad(t)}
                  className="flex items-center justify-between gap-2 min-h-[44px] py-2"
                >
                  <span className="truncate flex-1 min-w-0">{t.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 min-w-[36px] min-h-[36px] shrink-0 opacity-70 hover:opacity-100 touch-manipulation"
                    aria-label={`Delete ${t.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(e, t);
                    }}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Save template</DialogTitle>
            <DialogDescription>Give this configuration a name (e.g. &quot;Q1 campaign&quot;, &quot;Product launch&quot;) so you can load it later.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="template-name">Template name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Q1 campaign"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSave())}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setSaveOpen(false)} className="min-h-[44px] touch-manipulation flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} className="min-h-[44px] touch-manipulation flex-1 sm:flex-initial">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
