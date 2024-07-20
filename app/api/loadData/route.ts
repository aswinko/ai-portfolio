import { createCollection, loadData } from "@/database/loadDB";

export async function POST(req: any, res: any) {
  try {
    await createCollection();
    await loadData();
    res.status(200).json({ message: "Data loaded successfully" });
  } catch (error) {
    console.log(error);
  }
}
