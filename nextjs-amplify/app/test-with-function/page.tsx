
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
const client = generateClient<Schema>() 

export default async function Page() {
 
  async function handleFunctionCall() {
  const { data, errors } = await client.queries.invokeHello({ 
    name: "Frontend" 
  });
  
  if (data) {
    console.log("Function Response:", data); 
    // Logs: "Hello, Frontend! This message is from your Lambda function."
  }
}

  return (
    <ul>
      hello
    </ul>
  )
}