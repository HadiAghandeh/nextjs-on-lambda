
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useState } from "react";

const client = generateClient<Schema>()

export default function Page() {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFunctionCall() {
    setLoading(true);
    try {
      const { data, errors } = await client.queries.invokeHello({
        name: "Frontend"
      });

      if (data) {
        setResponse(data);
        console.log("Function Response:", data);
      } else if (errors) {
        console.error("Errors:", errors);
        setResponse("Error occurred");
      }
    } catch (error) {
      console.error("Error:", error);
      setResponse("Error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Test with Function</h1>
      <button onClick={handleFunctionCall} disabled={loading}>
        {loading ? "Loading..." : "Call Function"}
      </button>
      {response && (
        <p>Function Response: {response}</p>
      )}
    </div>
  )
}
