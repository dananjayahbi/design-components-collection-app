-- CreateTable
CREATE TABLE "LayoutSettings" (
    "id" TEXT NOT NULL,
    "showGenerateContent" BOOLEAN NOT NULL DEFAULT true,
    "showViewContent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LayoutSettings_pkey" PRIMARY KEY ("id")
);
