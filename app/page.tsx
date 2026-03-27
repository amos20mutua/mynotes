import { VaultWorkspace } from "@/components/vault/vault-workspace";
import { readInitialVault } from "@/lib/vault/server-repository";

export default async function HomePage() {
  const initialVault = await readInitialVault();

  return <VaultWorkspace initialVault={initialVault} />;
}
