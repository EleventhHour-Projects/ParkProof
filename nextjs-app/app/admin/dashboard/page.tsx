// app/admin/dashboard/page.tsx
import RiskTable from "@/components/admin/RiskTable";
import StatsCards from "@/components/admin/StatsCards";
import { headers } from "next/headers";
export default async function AdminDashboardPage() {
    const host = (await headers()).get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const parkingLots = await fetch(
    `${baseUrl}/api/admin/parking-lots`,
    { cache: "no-store" }
  ).then(res => res.json());

  const stats = await fetch(
    `${baseUrl}/api/admin/dashboard-stats`,
    { cache: "no-store" }
  ).then(res => res.json());

  return (
    <>
      <RiskTable parkingLots={parkingLots} />
      <StatsCards stats={stats} />
    </>
  );
}
