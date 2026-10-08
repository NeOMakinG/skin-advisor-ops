import { z } from "zod";
import { User } from "@/schemas/user";

// Fictional people. Parsed at module load so a typo fails fast, not in a component.
export const users = z.array(User).parse([
  { id: "usr_001", name: "Priya Raman", role: "admin" },
  { id: "usr_002", name: "Tomas Ferreira", role: "analyst" },
  { id: "usr_003", name: "Mei Lindqvist", role: "analyst" },
]);

export const defaultUser = users[0] as User;
