import { db } from "../server/db"; // just to check types
import { registrations } from "../drizzle/schema";

async function test() {
  const dbInst = await import("../server/db").then(m => m.getDb());
  if (dbInst) {
    const [result] = await dbInst.insert(registrations).values({} as any);
    console.log(result.insertId);
  }
}
