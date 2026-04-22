import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  text: string;
}

export function InfoTooltip({ text }: Props) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More information"
            className="inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:text-primary"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-xs leading-relaxed bg-card border-border text-foreground"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}