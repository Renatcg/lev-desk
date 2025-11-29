import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const memberSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  cargo: z.string().min(2, "Cargo deve ter pelo menos 2 caracteres"),
  profileId: z.string().min(1, "Selecione um perfil"),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export const AddMemberDialog = ({ open, onOpenChange, projectId, projectName }: AddMemberDialogProps) => {
  const [submitting, setSubmitting] = useState(false);

  const { data: profiles } = useQuery({
    queryKey: ["project-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_profiles")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
  });

  const profileId = watch("profileId");

  const onSubmit = async (data: MemberFormData) => {
    setSubmitting(true);
    try {
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: tempPassword,
        options: {
          data: { name: data.name },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário");

      // Create profile entry (if not exists via trigger)
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          must_change_password: true,
        });

      if (profileError) throw profileError;

      // Add to project team
      const { error: memberError } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: authData.user.id,
          profile_id: data.profileId,
          cargo: data.cargo,
          whatsapp: data.phone,
        });

      if (memberError) throw memberError;

      // TODO: Call edge function to send welcome notifications
      // await supabase.functions.invoke('send-welcome-notification', {
      //   body: { userId: authData.user.id, projectId, tempPassword }
      // });

      toast.success("Membro adicionado com sucesso!");
      reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao adicionar membro:", error);
      toast.error(error.message || "Erro ao adicionar membro");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
          <DialogDescription>
            Adicione um novo membro à equipe do projeto {projectName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone / WhatsApp *</Label>
            <Input
              id="phone"
              placeholder="(00) 00000-0000"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo *</Label>
            <Input id="cargo" {...register("cargo")} />
            {errors.cargo && (
              <p className="text-sm text-destructive">{errors.cargo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile">Perfil *</Label>
            <Select value={profileId} onValueChange={(value) => setValue("profileId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {profiles?.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.profileId && (
              <p className="text-sm text-destructive">{errors.profileId.message}</p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
