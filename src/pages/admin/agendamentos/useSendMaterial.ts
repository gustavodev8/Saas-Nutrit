import { useState } from "react";
import { supabase, type Booking } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { getOperationalErrorMessage, recordOperationalEvent } from "@/lib/operationalLogs";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const MAX_ATTACH_BYTES = 10 * 1024 * 1024;

export interface AttachmentFile {
  name: string;
  base64: string;
  size: number;
  type: string;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const useSendMaterial = () => {
  const [sendTarget, setSendTarget] = useState<Booking | null>(null);
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendFiles, setSendFiles] = useState<AttachmentFile[]>([]);
  const [sending, setSending] = useState(false);

  const openSendMaterial = (booking: Booking) => {
    setSendTarget(booking);
    setSendSubject("");
    setSendBody("");
    setSendFiles([]);
  };

  const handleAddFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files || []);
    event.target.value = "";
    if (!picked.length) return;

    const current = sendFiles.reduce((acc, file) => acc + file.size, 0);
    const incoming = picked.reduce((acc, file) => acc + file.size, 0);
    if (current + incoming > MAX_ATTACH_BYTES) {
      recordOperationalEvent({
        area: "email",
        status: "warning",
        action: "Anexos recusados",
        message: "O envio de material foi bloqueado por ultrapassar 10 MB.",
        context: { currentBytes: current, incomingBytes: incoming, files: picked.length },
      });
      toast({
        title: "Anexos acima de 10 MB",
        description: "Reduza o tamanho dos arquivos ou envie em mais de uma mensagem. O evento foi registrado em Operacao.",
        variant: "destructive",
      });
      return;
    }

    const converted = await Promise.all(
      picked.map(async file => ({
        name: file.name,
        base64: await fileToBase64(file),
        size: file.size,
        type: file.type,
      }))
    );
    setSendFiles(prev => [...prev, ...converted]);
  };

  const handleSendMaterial = async () => {
    if (!sendTarget || !sendSubject.trim() || !sendBody.trim()) {
      toast({ title: "Preencha assunto e mensagem", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("Sessão administrativa expirada. Faça login novamente.");
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-material`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          to: sendTarget.client_email,
          client_name: sendTarget.client_name,
          subject: sendSubject.trim(),
          body: sendBody.trim(),
          attachments: sendFiles.map(file => ({ filename: file.name, content: file.base64 })),
        }),
      });

      let data: Record<string, string> = {};
      try { data = await res.json(); } catch { /* empty body */ }

      if (!res.ok) {
        const msg = data.error || data.message || data.msg || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      recordOperationalEvent({
        area: "email",
        status: "success",
        action: "Material enviado",
        message: "Email com material enviado ao paciente.",
        context: {
          email: sendTarget.client_email,
          patient: sendTarget.client_name,
          attachments: sendFiles.length,
        },
      });
      toast({ title: "Email enviado!", description: `Para ${sendTarget.client_email}` });
      setSendTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      recordOperationalEvent({
        area: "email",
        status: "error",
        action: "Falha ao enviar material",
        message,
        context: {
          email: sendTarget.client_email,
          patient: sendTarget.client_name,
          attachments: sendFiles.length,
        },
      });
      toast({
        title: "Erro ao enviar email",
        description: getOperationalErrorMessage("email", message),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const removeSendFile = (index: number) => {
    setSendFiles(prev => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  return {
    sendTarget,
    setSendTarget,
    sendSubject,
    setSendSubject,
    sendBody,
    setSendBody,
    sendFiles,
    sending,
    openSendMaterial,
    handleAddFiles,
    handleSendMaterial,
    removeSendFile,
  };
};
