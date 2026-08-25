import { listProjectsForCurrentUser } from "@/lib/data";
import ProjectsClient from "./ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjectsForCurrentUser();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">프로젝트</h1>
      <p className="text-sm text-slate-500">
        업무를 분류하기 위한 프로젝트(연구 주제) 목록입니다.
      </p>
      <ProjectsClient initialProjects={projects} />
    </div>
  );
}
