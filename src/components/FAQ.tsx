"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

const FAQ_ITEMS = [
  {
    question: "Lupra nedir?",
    answer:
      "Operasyonel iş akışlarını otonom yapay zeka agent'larına devrettiğin bir platform. Tanımla, kur, Lupra halleder.",
  },
  {
    question: "Lupra nasıl çalışır?",
    answer:
      "Kurallarını öğrenir → e-posta/API'ye entegre olur → görevleri 7/24 otomatik işler → sonuçları sana iletir.",
  },
  {
    question: "Kritik kararlarda kontrol kimde kalır?",
    answer:
      "Sende. Lupra, senin tanımladığın kurallar çerçevesinde çalışır; şüpheli durumlar senin kontrolünde kalır.",
  },
  {
    question: "Lupra hangi sistemlere bağlanır?",
    answer: "E-posta, API. Yakında: Telegram, Slack, Google Sheets, Webhook.",
  },
  {
    question: "Lupra kimler için uygun?",
    answer:
      "Operasyonel iş yükü olan, tekrar eden görevleri yönetmek isteyen ekipler ve işletmeler için.",
  },
  {
    question: "Lupra ne zaman kullanıma açılacak?",
    answer:
      "Lupra şu anda aktif geliştirme aşamasında. Kesin tarih henüz netleşmedi; erken erişim listesine katılanlar gelişmelerden ilk haberdar olur.",
  },
  {
    question: "Lupra'nın fiyatı nedir?",
    answer:
      "Kurulum 3.000-15.000 TL, aylık 900-4.500 TL arasında değişir — işletme büyüklüğüne göre.",
  },
  {
    question: "Nasıl başlayabilirim?",
    answer: "Aşağıdaki erken erişim formundan kaydol, gelişmelerden ilk sen haberdar olursun.",
  },
  {
    question: "Destek var mı?",
    answer: "Evet. lupra.app@gmail.com üzerinden ulaşabilirsin.",
  },
  {
    question: "Veri güvenliği nasıl sağlanıyor?",
    answer:
      "Verilerin Supabase altyapısında (enterprise-grade) tutulur, şifrelenir ve bizde saklanmaz. KVKK'ya uyumludur.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  // İlk soru açık başlıyor: hepsi kapalıyken bölüm boş bir liste gibi duruyor
  // ve içeride cevap olduğu anlaşılmıyor.
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-faq-item]", sectionRef.current);

      if (prefersReducedMotion()) {
        gsap.set(items, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(items, { opacity: 0, y: 20 });
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.08,
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section id="faq" ref={sectionRef} className="relative px-5 py-24 sm:px-8 sm:py-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-3xl">
        <h2 className="font-heading text-3xl font-semibold text-white sm:text-4xl">
          Sıkça sorulan sorular
        </h2>
        <div className="mt-14 flex flex-col gap-3">
          {FAQ_ITEMS.map((item, index) => {
            const open = openIndex === index;
            const panelId = `sss-cevap-${index}`;
            const buttonId = `sss-soru-${index}`;

            return (
              <div
                key={item.question}
                data-faq-item
                className="overflow-hidden rounded-2xl border border-white/6 bg-bg-raised/75 backdrop-blur-sm transition-colors hover:border-white/15"
              >
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? null : index)}
                    data-cursor-hover
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left sm:px-7"
                  >
                    <span className="font-heading text-lg font-semibold text-white">
                      {item.question}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`shrink-0 text-accent-light transition-transform duration-300 ${
                        open ? "rotate-45" : ""
                      }`}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M10 4v12M4 10h12"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>
                </h3>

                {/* grid-rows 0fr -> 1fr: cevap DOM'da kalıyor, yalnızca
                    görsel olarak katlanıyor. display:none kullanmamanın sebebi
                    SEO rehberi: gizlenen metin alıntılanmıyor. Sayfadaki
                    FAQPage yapılandırılmış verisi de tam metni taşımaya
                    devam ediyor. */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-muted sm:px-7">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
