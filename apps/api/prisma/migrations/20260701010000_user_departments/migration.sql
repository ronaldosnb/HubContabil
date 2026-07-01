CREATE TABLE "UserDepartment" (
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDepartment_pkey" PRIMARY KEY ("userId","departmentId")
);

CREATE INDEX "UserDepartment_departmentId_idx" ON "UserDepartment"("departmentId");

ALTER TABLE "UserDepartment" ADD CONSTRAINT "UserDepartment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserDepartment" ADD CONSTRAINT "UserDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
