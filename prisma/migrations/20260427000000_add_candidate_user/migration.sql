ALTER TABLE "Candidate" ADD COLUMN "userId" TEXT;

CREATE INDEX "Candidate_userId_idx" ON "Candidate"("userId");

ALTER TABLE "Candidate"
ADD CONSTRAINT "Candidate_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
