-- AlterTable
ALTER TABLE "maps" ADD COLUMN "description" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_characters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT '{}',
    "tokenData" TEXT NOT NULL DEFAULT '{}',
    "templateId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "characters_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "characters_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "sheet_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_characters" ("campaignId", "createdAt", "data", "id", "name", "tokenData", "type", "updatedAt", "userId") SELECT "campaignId", "createdAt", "data", "id", "name", "tokenData", "type", "updatedAt", "userId" FROM "characters";
DROP TABLE "characters";
ALTER TABLE "new_characters" RENAME TO "characters";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
