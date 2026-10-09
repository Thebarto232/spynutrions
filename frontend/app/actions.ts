"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { guardarFavorito, quitarFavorito, recetaAleatoria } from "@/lib/api";

export async function sorprender() {
  const receta = await recetaAleatoria();
  redirect(`/receta/${receta.id}`);
}

export async function guardar(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await guardarFavorito(id);
  revalidatePath("/favoritos");
  redirect("/favoritos");
}

export async function quitar(formData: FormData) {
  const id = Number(formData.get("id"));
  await quitarFavorito(id);
  revalidatePath("/favoritos");
}
