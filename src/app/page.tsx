import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Features } from "@/components/Features";
import { IdeaWall } from "@/components/IdeaWall";
import { FAQ } from "@/components/FAQ";
import { EarlyAccess } from "@/components/EarlyAccess";
import { Footer } from "@/components/Footer";
import { getUserSession } from "@/lib/dal";
import { listSiteComments } from "@/lib/blog-data";

export default async function Home() {
  // Oturum ve fikir duvarı sunucuda okunuyor; Nav ve IdeaWall client
  // component'leri veriyi prop olarak alıyor.
  const [session, ideas] = await Promise.all([getUserSession(), listSiteComments()]);

  return (
    <>
      <Nav
        session={
          session
            ? {
                displayName: session.displayName,
                email: session.email,
                avatarUrl: session.avatarUrl,
              }
            : null
        }
      />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <IdeaWall comments={ideas} />
        <FAQ />
        <EarlyAccess />
      </main>
      <Footer />
    </>
  );
}
