-- CreateTable
CREATE TABLE "UserRoomStats" (
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "totalAdded" INTEGER NOT NULL,
    "totalLikesGot" INTEGER NOT NULL,
    "totalLikesGiven" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRoomStats_pkey" PRIMARY KEY ("userId","roomId")
);

-- CreateTable
CREATE TABLE "RoomStreamTrending" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "extractedId" TEXT NOT NULL,
    "recentUpvotes" INTEGER NOT NULL,
    "recentPlays" INTEGER NOT NULL,
    "trendingScore" DOUBLE PRECISION NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomStreamTrending_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomStreamTrending_roomId_trendingScore_idx" ON "RoomStreamTrending"("roomId", "trendingScore");

-- CreateIndex
CREATE INDEX "Stream_userId_addedById_idx" ON "Stream"("userId", "addedById");

-- CreateIndex
CREATE INDEX "Stream_userId_createAt_idx" ON "Stream"("userId", "createAt");

-- CreateIndex
CREATE INDEX "Upvote_streamId_idx" ON "Upvote"("streamId");

-- RenameForeignKey
ALTER TABLE "Stream" RENAME CONSTRAINT "User" TO "user";
