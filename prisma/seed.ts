// Idempotent demo-data seed: creates the single MVP user plus a couple of
// sample projects/tasks so `npm run dev` has something to look at right
// away. Safe to re-run — it upserts by unique key and skips task creation
// if any task already exists for the user.
import { PrismaClient } from "@prisma/client";
import { DEFAULT_USER_EMAIL } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: { email: DEFAULT_USER_EMAIL, name: "연구원" },
  });

  const existingTaskCount = await prisma.task.count({ where: { ownerId: user.id } });
  if (existingTaskCount > 0) {
    console.log("Seed skipped: tasks already exist for the demo user.");
    return;
  }

  const project = await prisma.project.create({
    data: {
      name: "학습 알고리즘 연구",
      description: "2026년 상반기 연구 과제",
      color: "#2563eb",
      ownerId: user.id,
    },
  });

  const today = new Date();
  const inDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };

  await prisma.task.create({
    data: {
      title: "논문 초안 작성",
      description: "실험 결과를 바탕으로 논문 초안을 작성한다.",
      tags: "논문,작성",
      importance: "HIGH",
      status: "IN_PROGRESS",
      startDate: inDays(-2),
      dueDate: inDays(5),
      ownerId: user.id,
      projectId: project.id,
      planSteps: {
        create: [
          { title: "서론 작성", order: 0, isDone: true, completedAt: inDays(-1) },
          { title: "실험 방법 정리", order: 1, isDone: true, completedAt: today },
          { title: "결과 분석 및 그래프", order: 2, isDone: false },
          { title: "초안 검토 요청", order: 3, isDone: false },
        ],
      },
      activityLogs: {
        create: [
          { type: "CREATED", message: '"논문 초안 작성" 업무가 생성되었습니다.', actorId: user.id },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: "실험 장비 점검",
      importance: "URGENT",
      status: "PLANNED",
      dueDate: inDays(1),
      ownerId: user.id,
      projectId: project.id,
      activityLogs: {
        create: [
          { type: "CREATED", message: '"실험 장비 점검" 업무가 생성되었습니다.', actorId: user.id },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: "주간 랩미팅 준비",
      importance: "NORMAL",
      status: "PLANNED",
      dueDate: inDays(3),
      ownerId: user.id,
      activityLogs: {
        create: [
          { type: "CREATED", message: '"주간 랩미팅 준비" 업무가 생성되었습니다.', actorId: user.id },
        ],
      },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
