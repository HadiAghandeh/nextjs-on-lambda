import { defineFunction } from "@aws-amplify/backend";

export const HelloFunction = defineFunction({
  name: "my-first-function",
  entry: "./handler.ts",
  memoryMB: 256
});