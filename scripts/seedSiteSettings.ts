import "dotenv/config";
import { getDb, upsertSiteSetting } from "../server/db.js";

const SOCIAL_LINKS: Record<string, string> = {
  twitter: "https://x.com/royaliconevents",
  instagram: "https://www.instagram.com/royaliconevents_ke/",
  facebook: "https://www.facebook.com/profile.php?id=61590916191014",
  tiktok: "https://www.tiktok.com/@royaliconevents?is_from_webapp=1&sender_device=pc",
  youtube: "https://www.youtube.com/@RoyalsIconevents",
  whatsapp: "https://wa.me/254702894309",
};

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL not set or DB unreachable. Aborting.");
    process.exit(1);
  }

  for (const [key, value] of Object.entries(SOCIAL_LINKS)) {
    await upsertSiteSetting(key, value);
    console.log(`Seeded site_setting: ${key} = ${value}`);
  }

  console.log("Done seeding social media links.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
