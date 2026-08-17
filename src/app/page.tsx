import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Products } from "@/components/Products";
import { Features } from "@/components/Features";
import { LatestPosts } from "@/components/LatestPosts";
import { IdeaWall } from "@/components/IdeaWall";
import { FAQ } from "@/components/FAQ";
import { EarlyAccess } from "@/components/EarlyAccess";
import { Footer } from "@/components/Footer";
import { getUserSession } from "@/lib/dal";
import { listSiteComments, listPublishedPosts } from "@/lib/blog-data";
import { listPublishedProjects } from "@/lib/project-data";

export default async function Home() {
  // Sunucuda okunup client component'lere prop olarak geçiyor.
  const [session, ideas, projects, posts] = await Promise.all([
    getUserSession(),
    listSiteComments(),
    listPublishedProjects(4),
    listPublishedPosts(),
  ]);

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
        {/* Ürün ve blog bölümleri içerik YOKSA hiç render edilmiyor: boş bir
            "Ürünler" başlığı, ürün olmadığını duyurmaktan başka işe yaramaz. */}
        {projects.length > 0 && <Products projects={projects} />}
        <Features />
        {posts.length > 0 && <LatestPosts posts={posts.slice(0, 3)} />}
        <IdeaWall comments={ideas} />
        <FAQ />
        <EarlyAccess />
      </main>
      <Footer />
    </>
  );
}
