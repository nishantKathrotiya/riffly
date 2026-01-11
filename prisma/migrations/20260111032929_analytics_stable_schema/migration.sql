/*
  Warnings:

  - You are about to drop the column `streamId` on the `RoomStreamTrending` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roomId,extractedId]` on the table `RoomStreamTrending` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "RoomStreamTrending" DROP COLUMN "streamId",
ALTER COLUMN "recentUpvotes" SET DEFAULT 0,
ALTER COLUMN "recentPlays" SET DEFAULT 0,
ALTER COLUMN "trendingScore" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "UserRoomStats" ALTER COLUMN "totalAdded" SET DEFAULT 0,
ALTER COLUMN "totalLikesGot" SET DEFAULT 0,
ALTER COLUMN "totalLikesGiven" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "RoomStreamTrending_roomId_extractedId_key" ON "RoomStreamTrending"("roomId", "extractedId");
