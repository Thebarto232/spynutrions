import { Stethoscope } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TEXTO =
  "Esta herramienta es informativa y no reemplaza la consulta con un nutricionista o médico.";

export function AvisoMedico({
  texto = TEXTO,
  className,
}: {
  texto?: string;
  className?: string;
}) {
  return (
    <Alert className={className}>
      <Stethoscope aria-hidden="true" />
      <AlertTitle>Aviso</AlertTitle>
      <AlertDescription>{texto}</AlertDescription>
    </Alert>
  );
}
