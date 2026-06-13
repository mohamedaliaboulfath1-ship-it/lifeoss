import { redirect } from "next/navigation";

/** Legacy PARA Resources route → Journal OS */
export default function ResourcesRedirectPage() {
  redirect("/journal");
}
