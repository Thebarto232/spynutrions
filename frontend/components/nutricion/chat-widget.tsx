"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChatBubble } from "@/components/nutricion/chat-bubble";
import { Escribiendo } from "@/components/nutricion/escribiendo";
import type { MensajeChat } from "@/lib/chat-memoria";

const SUGERENCIAS = [
  "¿Qué como hoy?",
  "¿Por qué este plan?",
  "Recomiéndame una cena",
  "Muéstrame el lunes",
  "Genera mi lista de compras",
];

export function ChatWidget({
  abierto,
  onAbierto,
  mensajes,
  memoria,
  verMemoria,
  texto,
  escribiendo,
  error,
  onTexto,
  onEnviar,
  onToggleMemoria,
  onLimpiar,
  onBorrarMemoria,
}: {
  abierto: boolean;
  onAbierto: (abierto: boolean) => void;
  mensajes: MensajeChat[];
  memoria: string[];
  verMemoria: boolean;
  texto: string;
  escribiendo: boolean;
  error: string | null;
  onTexto: (texto: string) => void;
  onEnviar: (contenido: string) => void;
  onToggleMemoria: () => void;
  onLimpiar: () => void;
  onBorrarMemoria: () => void;
}) {
  const zona = useRef<HTMLDivElement>(null);
  const reducido = useReducedMotion();
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    const viewport = zona.current?.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
    viewport?.scrollTo({ top: viewport.scrollHeight, behavior: reducido ? "auto" : "smooth" });
  }, [mensajes, escribiendo, abierto, verMemoria, reducido]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    onEnviar(texto);
  }

  if (!montado) return null;

  return createPortal(
    <div className="print:hidden fixed bottom-4 right-4 z-40">
      <Button type="button" size="lg" aria-expanded={abierto} onClick={() => onAbierto(!abierto)}>
        <MessageCircle aria-hidden="true" />
        Consulta
      </Button>
      <Sheet open={abierto} onOpenChange={onAbierto}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-serif text-xl">Consulta</SheetTitle>
            <SheetDescription>Asistente informativo, no reemplaza a un nutricionista o médico.</SheetDescription>
          </SheetHeader>
          <div ref={zona} className="min-h-0 flex-1 overflow-hidden px-4">
            <Card className="h-full min-h-0 py-0 shadow-none">
              <CardContent className="h-full min-h-0 py-3">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-3">
                {mensajes.length === 0 ? (
                  <div className="space-y-3">
                    <p className="rounded-lg bg-muted px-3 py-2 text-sm leading-relaxed">
                      Hola. Leo tu plan, te muestro lo que comes, te recomiendo una receta y la agrego. También armo la lista de compras.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGERENCIAS.map((sugerencia) => (
                        <Button key={sugerencia} type="button" variant="outline" size="sm" onClick={() => onEnviar(sugerencia)}>
                          {sugerencia}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  mensajes.map((mensaje, indice) => <ChatBubble key={`${indice}-${mensaje.role}`} mensaje={mensaje} />)
                )}
                {escribiendo ? <Escribiendo /> : null}
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                {verMemoria ? (
                  <Card size="sm">
                    <CardHeader>
                      <CardTitle>Lo que recuerda</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {memoria.length === 0 ? (
                        <p className="text-muted-foreground">Todavía no guardó ningún dato.</p>
                      ) : (
                        <ul className="list-disc space-y-1 pl-4">
                          {memoria.map((hecho) => (
                            <li key={hecho}>{hecho}</li>
                          ))}
                        </ul>
                      )}
                      <Button type="button" variant="link" className="mt-2 px-0" onClick={onBorrarMemoria}>
                        Borrar lo que recuerda
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </ScrollArea>
              </CardContent>
            </Card>
          </div>
          <form onSubmit={onSubmit} className="shrink-0 border-t p-4">
            {mensajes.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {SUGERENCIAS.map((sugerencia) => (
                  <Button key={sugerencia} type="button" variant="outline" size="sm" disabled={escribiendo} onClick={() => onEnviar(sugerencia)}>
                    {sugerencia}
                  </Button>
                ))}
              </div>
            ) : null}
            <div className="flex gap-2">
              <Input
                value={texto}
                onChange={(event) => onTexto(event.target.value)}
                placeholder="Escribe tu consulta"
                aria-label="Mensaje"
                className="h-12! rounded-full! px-4! text-base! md:text-base!"
              />
              <Button type="submit" className="h-12 rounded-full px-5" disabled={escribiendo || !texto.trim()}>
                Enviar
              </Button>
            </div>
            <div className="mt-2 flex justify-between gap-3 text-xs">
              <Button type="button" variant="link" className="h-auto px-0 text-xs" onClick={onToggleMemoria}>
                Ver y borrar lo que el bot recuerda
              </Button>
              <Button type="button" variant="link" className="h-auto px-0 text-xs" onClick={onLimpiar}>
                Limpiar chat
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>,
    document.body,
  );
}
