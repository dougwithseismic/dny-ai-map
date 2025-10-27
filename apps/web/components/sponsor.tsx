import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Linkedin } from "lucide-react";

export function Sponsor() {
  return (
    <Card className="p-4 bg-muted/50">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground font-medium">map sponsor</p>
        <div className="space-y-1">
          <p className="font-medium text-sm">doug@withseismic.com</p>
          <p className="text-xs text-muted-foreground">
            Looking to team up with ambitious founders in Prague
          </p>
        </div>
        <Button asChild variant="default" size="sm" className="gap-2 w-full">
          <a
            href="https://linkedin.com/in/dougsilkstone"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Linkedin className="size-4" />
            Connect
          </a>
        </Button>
      </div>
    </Card>
  );
}
