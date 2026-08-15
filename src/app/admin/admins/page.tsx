import { requireAdmin } from "@/lib/dal";
import { listAdminUsers } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/format";
import { TablePanel, Td, Th, Tr } from "../components/AdminTable";
import { AddAdminForm } from "./components/AddAdminForm";
import { RemoveAdminButton } from "./components/RemoveAdminButton";

export const metadata = {
  title: "Yöneticiler | Admin",
};

export default async function AdminsPage() {
  const session = await requireAdmin();
  const admins = await listAdminUsers();
  const onlyOne = admins.length <= 1;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-white md:text-3xl">Yöneticiler</h1>
        <p className="mt-2 text-sm text-muted">
          Bu listedeki e-posta adresleri Google ile giriş yapıp panele erişebilir.
        </p>
      </div>

      <AddAdminForm />

      <TablePanel>
        <thead>
          <tr className="border-b border-white/15 bg-white/5">
            <Th>E-posta</Th>
            <Th>Eklenme</Th>
            <Th className="text-right">İşlem</Th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => {
            const isSelf = admin.email.toLowerCase() === session.email;
            return (
              <Tr key={admin.id}>
                <Td className="font-medium text-white">
                  {admin.email}
                  {isSelf && (
                    <span className="ml-2 rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-light">
                      Sen
                    </span>
                  )}
                </Td>
                <Td className="text-xs text-muted">{formatDateTime(admin.created_at)}</Td>
                <Td>
                  <RemoveAdminButton
                    email={admin.email}
                    disabled={isSelf || onlyOne}
                    disabledReason={
                      isSelf ? "Kendini çıkaramazsın" : "En az bir yönetici kalmalı"
                    }
                  />
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </TablePanel>

      <p className="mt-6 text-xs text-muted/70">
        Kendini listeden çıkaramazsın ve son yönetici silinemez — panele erişimin tamamen
        kapanmasını önlemek için bu kural hem uygulamada hem veritabanında zorunlu.
      </p>
    </div>
  );
}
