import { createCollection, loadData } from "@/database/loadDB";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
      await createCollection();
      await loadData();
      res.status(200).json({ message: 'Data loaded successfully' });
    } else {
      res.status(405).json({ message: 'Method Not Allowed' });
    }
  }