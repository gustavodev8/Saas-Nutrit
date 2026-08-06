import { Link } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PatientPortalDisabledStateProps {
  title: string;
  description: string;
}

export default function PatientPortalDisabledState({
  title,
  description,
}: PatientPortalDisabledStateProps) {
  return (
    <Card className="rounded-3xl border-dashed border-border/80">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-primary">
          <Settings2 size={18} />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/portal">Voltar para a central</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
