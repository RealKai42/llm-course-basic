import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);

export const TABLE_NAME = "kong";
export const DB_URI = path.join(currentDir, "../db");
