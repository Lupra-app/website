import { Suspense } from "react";
import { EarlyAccessTable } from "./components/EarlyAccessTable";
import { EarlyAccessLoading } from "./components/EarlyAccessLoading";

export const metadata = {
  title: "Erken Erişim | Admin",
};

export default function EarlyAccessPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-white">
          Erken Erişim Kayıtları
        </h1>
        <p className="mt-2 text-sm text-muted">
          Lupra&apos;ya erişim talebinde bulunan e-posta adreslerinin listesi.
        </p>
      </div>

      <Suspense fallback={<EarlyAccessLoading />}>
        <EarlyAccessTable />
      </Suspense>
    </div>
  );
}
