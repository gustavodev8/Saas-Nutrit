import { useEffect, useRef, useState } from "react";
import { Camera, ImageIcon, KeyRound, Loader2, Plus, Save, ShieldCheck, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  isValidPatientPortalLogin,
  normalizePatientPortalLogin,
  validatePatientPortalPassword,
} from "@/lib/patientPortalAuth";
import {
  formatCPF,
  hasPatientProfileChanges,
  validateCPF,
} from "@/lib/patientProfileUtils";
import {
  deletePatientPhoto,
  fetchPatientPhotos,
  fetchPatientPortalAccount,
  insertPatientPhoto,
  savePatientPortalAccount,
  type PatientPortalAccount,
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
  const [portalAccount, setPortalAccount] = useState<PatientPortalAccount | null>(null);
  const [portalForm, setPortalForm] = useState({
    login: "",
    password: "",
    confirmPassword: "",
    enabled: false,
  });
  const [portalLoading, setPortalLoading] = useState(true);
  const [portalSaving, setPortalSaving] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!patient.id) return;

    setPortalLoading(true);
    fetchPatientPortalAccount(patient.id)
      .then((account) => {
        setPortalAccount(account);
        setPortalForm({
          login: account?.login ?? "",
          password: "",
          confirmPassword: "",
          enabled: account?.is_active ?? false,
        });
      })
      .finally(() => setPortalLoading(false));
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

  const handleSavePortalAccess = async () => {
    if (!patient.id) {
      return;
    }

    const failPortalSave = (message: string) => {
      setPortalError(message);
      toast.error(message);
    };

    const normalizedLogin = normalizePatientPortalLogin(portalForm.login);
    const requiresPassword = portalForm.enabled && !portalAccount?.auth_user_id;
    const shouldValidatePassword = Boolean(portalForm.password) || requiresPassword;

    if (!normalizedLogin) {
      failPortalSave("Informe um login para o portal.");
      return;
    }

    if (!isValidPatientPortalLogin(normalizedLogin)) {
      failPortalSave("Use 4 a 32 caracteres com letras, numeros, ponto, traco ou underscore.");
      return;
    }

    if (shouldValidatePassword) {
      const passwordError = validatePatientPortalPassword(portalForm.password);
      if (passwordError) {
        failPortalSave(passwordError);
        return;
      }

      if (portalForm.password !== portalForm.confirmPassword) {
        failPortalSave("As senhas do portal nao coincidem.");
        return;
      }
    }

    setPortalSaving(true);
    setPortalError(null);
    try {
      const result = await savePatientPortalAccount({
        patientId: patient.id,
        login: normalizedLogin,
        password: portalForm.password || undefined,
        enabled: portalForm.enabled,
      });

      if (!result.ok || !result.account) {
        failPortalSave(result.message);
        return;
      }

      setPortalAccount(result.account);
      setPortalForm((current) => ({
        ...current,
        login: result.account?.login ?? current.login,
        password: "",
        confirmPassword: "",
        enabled: result.account?.is_active ?? current.enabled,
      }));
      toast.success(result.message);
    } catch (error) {
      console.error("[PatientProfileTab] handleSavePortalAccess:", error);
      failPortalSave("Nao foi possivel salvar o acesso do portal.");
    } finally {
      setPortalSaving(false);
    }
  };

  const formatAccessDate = (value?: string | null) => {
    if (!value) return "Ainda nao definida";
    return new Date(value).toLocaleString("pt-BR");
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

        <section className="space-y-4 border-t border-border/50 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.14em] text-primary">
                Acesso ao portal
              </h3>
              <p className="text-xs text-muted-foreground">
                O admin define login e senha do paciente. O portal usa acesso com senha, sem magic link.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleSavePortalAccess}
              disabled={portalSaving || portalLoading}
              variant="outline"
              className="h-9 rounded-xl px-4 font-bold"
            >
              {portalSaving ? <Loader2 size={15} className="mr-2 animate-spin" /> : <ShieldCheck size={15} className="mr-2" />}
              {portalSaving ? "Salvando..." : "Salvar acesso"}
            </Button>
          </div>

          {portalLoading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              Carregando configuracao do portal...
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {portalAccount?.is_active ? "Acesso ativo" : portalAccount ? "Acesso pausado" : "Acesso ainda nao criado"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ultima definicao de senha: {formatAccessDate(portalAccount?.password_set_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Liberar portal
                    </span>
                    <Switch
                      checked={portalForm.enabled}
                      onCheckedChange={(checked) => {
                        setPortalForm((current) => ({ ...current, enabled: checked }));
                        setPortalError(null);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <div className={fieldClass}>
                  <Label htmlFor="portal-login" className={labelClass}>
                    Login do portal
                  </Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <Input
                      id="portal-login"
                      value={portalForm.login}
                      onChange={(event) => {
                        setPortalForm((current) => ({ ...current, login: event.target.value }));
                        setPortalError(null);
                      }}
                      placeholder="paciente.login"
                      className="h-9 rounded-xl pl-9 bg-muted/20 border-border/80 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">Acesso do paciente</p>
                  <p className="mt-1">Use um login simples, sem espacos. O paciente entra em `/portal/login`.</p>
                </div>

                <div className={fieldClass}>
                  <Label htmlFor="portal-password" className={labelClass}>
                    Nova senha
                  </Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <Input
                      id="portal-password"
                      type="password"
                      value={portalForm.password}
                      onChange={(event) => {
                        setPortalForm((current) => ({ ...current, password: event.target.value }));
                        setPortalError(null);
                      }}
                      placeholder={portalAccount?.auth_user_id ? "Preencha apenas para redefinir" : "Senha inicial do portal"}
                      className="h-9 rounded-xl pl-9 bg-muted/20 border-border/80 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                <div className={fieldClass}>
                  <Label htmlFor="portal-confirm-password" className={labelClass}>
                    Confirmar senha
                  </Label>
                  <Input
                    id="portal-confirm-password"
                    type="password"
                    value={portalForm.confirmPassword}
                    onChange={(event) => {
                      setPortalForm((current) => ({ ...current, confirmPassword: event.target.value }));
                      setPortalError(null);
                    }}
                    placeholder="Repita a senha"
                    className="h-9 rounded-xl bg-muted/20 border-border/80 focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              {portalError ? (
                <p className="text-sm font-medium text-destructive">{portalError}</p>
              ) : null}
            </>
          )}
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
