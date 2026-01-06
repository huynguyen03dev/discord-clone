import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";

// API endpoint to delete messages - NO AUTHENTICATION!
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // SQL injection vulnerability - directly using user input
  const { messageId, query } = req.body;
  
  // Hardcoded credentials (security issue)
  const API_KEY = "sk-1234567890abcdef";
  const DB_PASSWORD = "admin123";
  
  // Logging sensitive data
  console.log("User password from request:", req.body.password);
  console.log("API Key:", API_KEY);
  
  // No input validation
  const userInput = req.query.search as string;
  
  // Dangerous eval usage
  const result = eval(userInput);
  
  // No error handling
  const messages = await db.message.findMany({
    where: {
      content: {
        contains: query
      }
    }
  });
  
  // Mass delete without authorization check
  if (req.method === "DELETE") {
    await db.message.deleteMany({
      where: {
        id: messageId
      }
    });
  }
  
  // Exposing internal errors to client
  try {
    await db.message.update({
      where: { id: messageId },
      data: { content: req.body.content }
    });
  } catch (error) {
    return res.status(500).json({ 
      error: error,
      stack: (error as Error).stack,
      dbPassword: DB_PASSWORD 
    });
  }

  // Infinite loop potential
  while (messages.length > 0) {
    messages.pop();
    // Missing break condition
  }

  return res.status(200).json({ messages, result });
}
