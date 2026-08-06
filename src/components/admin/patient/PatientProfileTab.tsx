import { useEffect, useRef, useState } from "react";
import { Camera, ImageIcon, Loader2, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  formatCPF,
  hasPatientProfileChanges,
  validateCPF,
} from "@/lib/patientProfileUtils";
import {
  deletePatientPhoto,
  fetchPatientPhotos,
  insertPatientPhoto,
  type Patient,
  type PatientPhoto,
  uploadPatientPhoto,
  upsertPatient,
} from "@/lib/supabase";

interface PatientProfileTabProps {
  patient: Patient;
  onSaved: (patient: Patient) => void;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
}

function Textarea({ minRows = 3, className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] ${className}`}
      rows={minRows}
      {...props}
    />
  );
}

export function PatientProfileTab({ patient, onSaved }: PatientProfileTabProps) {
  const [form, setForm] = useState<Patient>({ ...patient });
  const [saving, setSaving] = useState(false);
  const [cpfError, setCpfError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<PatientPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({ ...patient });
  }, [patient]);

  useEffect(() => {
    if (!patient.id) return;

    setLoadingPhotos(true);
    fetchPatientPhotos(patient.id)
      .then(setPhotos)
      .finally(() => setLoadingPhotos(false));
  }, [patient.id]);

  const setField = (field: keyof Patient, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const rawCpf = (form.cpf ?? "").replace(/\D/g, "");
    if (rawCpf && !validateCPF(rawCpf)) {
      setCpfError("CPF invalido - verifique os digitos.");
      return;
    }

    setCpfError(null);
    setSaving(true);

    try {
      const payload: Patient = { ...form, cpf: rawCpf || undefined };
      const updated = await upsertPatient(payload);

      if (updated) {
        onSaved(updated);
        toast.success("Perfil salvo com sucesso!");
      } else {
        toast.error("Erro ao salvar perfil.");
      }
    } catch {
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (!files.length || !patient.id) {
      return;
    }

    event.target.value = "";
    setUploading(true);

    let added = 0;

    for (const file of files) {
      const url = await uploadPatientPhoto(file);
      if (!url) {
        toast.error(`Falha ao enviar ${file.name}`);
        continue;
      }

      const saved = await insertPatientPhoto({ patient_id: patient.id, url });
      if (saved) {
        setPhotos((prev) => [saved, ...prev]);
        added += 1;
      }
    }

    setUploading(false);

    if (added > 0) {
      toast.success(added === 1 ? "Foto adicionada!" : `${added} fotos adicionadas!`);
    }
  };

  const handleDeletePhoto = async (photo: PatientPhoto) => {
    if (!photo.id) return;

    const deleted = await deletePatientPhoto(photo.id);
    if (deleted) {
      setPhotos((prev) => prev.filter((item) => item.id !== photo.id));
      return;
    }

    toast.error("Erro ao remover foto.");
  };

  const hasChanges = hasPatientProfileChanges(form, patient);
  const inputClass =
    "h-9 rounded-xl bg-muted/20 border-border/80 focus-visible:ring-primary/20";
  const fieldClass = "space-y-1.5";
  const labelClass =
    "text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
            Perfil clinico
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">
            Dados cadastrais do paciente
          </h2>
          <p className="text-sm text-muted-foreground">
            Informacoes essenciais para identificacao, contato e historico administrativo.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="h-9 rounded-xl px-4 font-bold shadow-sm"
        >
          {saving ? (
            <Loader2 size={15} className="mr-2 animate-spin" />
          ) : (
            <Save size={15} className="mr-2" />
          )}
          {saving ? "Salvando..." : hasChanges ? "Salvar alteracoes" : "Tudo salvo"}
        </Button>
      </div>

      <div className="space-y-5">
        <section className="space-y-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-primary">
              Dados pessoais
            </h3>
            <p className="text-xs text-muted-foreground">
              Identificacao principal usada no prontuario.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <div className={fieldClass}>
              <Label htmlFor="name" className={labelClass}>
                Nome completo
              </Label>
              <Input
                id="name"
                value={form.name || ""}
                onChange={(event) => setField("name", event.target.value)}
                className={inputClass}
              />
            </div>

            <div className={fieldClass}>
              <Label htmlFor="cpf" className={labelClass}>
                CPF
              </Label>
              <Input
                id="cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={formatCPF(form.cpf ?? "")}
                onChange={(event) => {
                  const raw = event.target.value.replace(/\D/g, "").slice(0, 11);
                  setField("cpf", raw);
                  if (cpfError) setCpfError(null);
                }}
                className={cn(
                  inputClass,
                  cpfError && "border-destructive focus-visible:ring-destructive/20",
                )}
              />
              {cpfError && <p className="text-xs font-medium text-destructive">{cpfError}</p>}
            </div>

            <div className={fieldClass}>
              <Label htmlFor="birth_date" className={labelClass}>
                Data de nascimento
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={form.birth_date || ""}
                onChange={(event) => setField("birth_date", event.target.value)}
                className={inputClass}
              />
            </div>

            <div className={fieldClass}>
              <Label htmlFor="gender" className={labelClass}>
                Genero
              </Label>
              <select
                id="gender"
                value={form.gender || ""}
                onChange={(event) => setField("gender", event.target.value)}
                className={cn("w-full px-3 py-2 text-sm focus:outline-none focus:ring-2", inputClass)}
              >
                <option value="">Selecionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-3 border-t border-border/50 pt-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-primary">
              Contato
            </h3>
            <p className="text-xs text-muted-foreground">
              Canais para retorno, envio de materiais e confirmacoes.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <div className={fieldClass}>
              <Label htmlFor="email" className={labelClass}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email || ""}
                onChange={(event) => setField("email", event.target.value)}
                className={inputClass}
              />
            </div>

            <div className={fieldClass}>
              <Label htmlFor="phone" className={labelClass}>
                Telefone
              </Label>
              <Input
                id="phone"
                value={form.phone || ""}
                onChange={(event) => setField("phone", event.target.value)}
                className={inputClass}
              />
            </div>

            <div className={fieldClass}>
              <Label htmlFor="city" className={labelClass}>
                Cidade
              </Label>
              <Input
                id="city"
                value={form.city || ""}
                onChange={(event) => setField("city", event.target.value)}
                className={inputClass}
              />
            </div>

            <div className={fieldClass}>
              <Label htmlFor="occupation" className={labelClass}>
                Ocupacao
              </Label>
              <Input
                id="occupation"
                value={form.occupation || ""}
                onChange={(event) => setField("occupation", event.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3 border-t border-border/50 pt-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-primary">
              Informacoes adicionais
            </h3>
            <p className="text-xs text-muted-foreground">
              Observacoes gerais visiveis no perfil do prontuario.
            </p>
          </div>
          <div className={fieldClass}>
            <Label htmlFor="notes" className={labelClass}>
              Observacoes gerais
            </Label>
            <Textarea
              id="notes"
              minRows={3}
              value={form.notes || ""}
              onChange={(event) => setField("notes", event.target.value)}
              className="min-h-[92px] rounded-xl border-border/80 bg-muted/20 focus-visible:ring-primary/20"
            />
          </div>
        </section>
      </div>

      <div className="space-y-4 border-t border-border/60 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Camera size={20} className="text-primary" />
            Galeria de Evolucao
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-10 gap-2 rounded-xl font-bold"
            disabled={uploading}
            onClick={() => photoInputRef.current?.click()}
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Upload de Fotos
          </Button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        {loadingPhotos ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 animate-spin" /> Carregando galeria...
          </div>
        ) : photos.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-border text-muted-foreground/60">
            <ImageIcon size={40} className="opacity-20" />
            <p className="text-sm font-medium">Nenhuma foto de evolucao anexada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-sm"
              >
                <img
                  src={photo.url}
                  className="h-full w-full cursor-pointer object-cover"
                  onClick={() => setLightbox(photo.url)}
                />
                <button
                  onClick={() => handleDeletePhoto(photo)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="animate-in fade-in fixed inset-0 z-[999] flex items-center justify-center bg-black/95 p-6 duration-300"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white transition-colors hover:bg-white/20">
            <X size={24} />
          </button>
          <img
            src={lightbox}
            className="max-h-[90vh] max-w-full rounded-3xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
