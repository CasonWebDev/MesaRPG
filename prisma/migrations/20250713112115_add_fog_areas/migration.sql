-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_game_states" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "activeMapId" TEXT,
    "tokens" TEXT NOT NULL DEFAULT '[]',
    "gameData" TEXT NOT NULL DEFAULT '{}',
    "gridConfig" TEXT NOT NULL DEFAULT '{}',
    "fogAreas" TEXT NOT NULL DEFAULT '[]',
    "lastActivity" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "game_states_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_game_states" ("activeMapId", "campaignId", "gameData", "gridConfig", "id", "lastActivity", "tokens", "updatedAt") SELECT "activeMapId", "campaignId", "gameData", "gridConfig", "id", "lastActivity", "tokens", "updatedAt" FROM "game_states";
DROP TABLE "game_states";
ALTER TABLE "new_game_states" RENAME TO "game_states";
CREATE UNIQUE INDEX "game_states_campaignId_key" ON "game_states"("campaignId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
