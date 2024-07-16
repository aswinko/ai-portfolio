import { createCollection, loadData } from "@/database/loadDB";

// export default async function handler(req: any, res: any) {
//   if (req.method === "POST") {
//     await createCollection();
//     await loadData();
//     res.status(200).json({ message: "Data loaded successfully" });
//   } else {
//     res.status(405).json({ message: "Method Not Allowed" });
//   }
// }

export async function POST(req: any, res: any) {
  try {
    await createCollection();
    await loadData();
    res.status(200).json({ message: "Data loaded successfully" });
  } catch (error) {
    console.log(error);
  }
}
