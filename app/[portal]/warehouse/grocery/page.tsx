import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ portal: string }> }) {
  const { portal } = await params;
  redirect(`/${portal}/warehouse/grocery/overview`);
}
